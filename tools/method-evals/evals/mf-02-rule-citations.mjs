/**
 * MF-02 — every numbered-rule citation in the method resolves to a rule
 * that exists in the file it names.
 *
 * THE CONTRACT NOBODY READS. The method cites its own rules by ORDINAL —
 * "lane-protocol.md rule 7", "../lane-protocol.md rule 3", "(rule 4,
 * tasks/TASK-FORMAT.md)", "lane-protocol.md rules 4, 6". A rule inserted,
 * removed or reordered renumbers every rule after it, and every citation
 * of those then points at the wrong sentence while still reading like a
 * citation. Nothing anywhere reds. This is docs/CONVENTIONS.md's own
 * A CITATION NAMES A SYMBOL, NOT A LINE one level up — an ordinal IS a
 * line number wearing a rule's clothes — and the method has no equivalent
 * of the symbol names that bullet recommends, because a protocol's rules
 * are numbered by design.
 *
 * WHAT IT RESOLVES, AND WHAT IT DELIBERATELY DOES NOT.
 *
 *   QUALIFIED   `<file>.md rule N` / `rules N, M` — resolved against the
 *               numbered items of THAT file. This is the whole point:
 *               `roles/integrator.md rule 1` is NOT a lane-protocol
 *               citation, and an eval that assumed one file owned every
 *               ordinal would be wrong about that line today.
 *   SELF        a bare `rule N` inside a file that owns a `## The rules`
 *               heading, resolved against its own list.
 *   SKIPPED     a bare `rule N` anywhere else. `roles/executor.md`'s "the
 *               brief's rule 2" points at an UNNUMBERED bullet list, so
 *               there is no ordinal to resolve; guessing at a referent is
 *               how a check starts answering a different question.
 *
 * The skipped class is why the coverage count is REPORTED on every pass.
 * A citation audit that examined nothing would otherwise be green.
 */

import { control, degraded, readCorpus } from "../lib/corpus.mjs";

const METHOD_DIRS = "roles|tasks|interview|rooms|runtime|adapters|docs-templates";

/** `<path>.md[,] rule(s) N[, M][ and M]` — the file first, the ordinals second. */
const QUALIFIED =
  new RegExp(
    String.raw`(?<![\w./-])((?:\.\./)?(?:method/)?(?:(?:${METHOD_DIRS})/)?[\w.-]+\.md),?\s+rules?\s+(\d+(?:\s*(?:,|and)\s*\d+)*)`,
    "gi",
  );

/** A bare ordinal, for the self-referring case. */
const BARE = /(?<![\w./-])rules?\s+(\d+(?:\s*(?:,|and)\s*\d+)*)/gi;

/**
 * The ordinals of a file's own top-level numbered list.
 *
 * @param {string} text
 * @returns {Set<number>}
 */
function numberedItems(text) {
  /** @type {Set<number>} */
  const items = new Set();
  for (const line of text.split("\n")) {
    const m = /^ {0,3}(\d+)\.\s/.exec(line);
    if (m !== null) items.add(Number(m[1]));
  }
  return items;
}

/**
 * Resolve a cited path against the method tree.
 *
 * @param {import("../lib/corpus.mjs").Corpus} corpus
 * @param {string} raw
 * @returns {string | null}
 */
function resolveFile(corpus, raw) {
  const stripped = raw.replace(/^\.\.\//, "").replace(/^method\//, "");
  const rel = `method/${stripped}`;
  return corpus.has(rel) ? rel : null;
}

/** @param {string} list @returns {number[]} */
const ordinals = (list) => list.split(/\s*(?:,|and)\s*/).map(Number).filter((n) => !Number.isNaN(n));

/**
 * @param {import("../lib/corpus.mjs").Corpus} corpus
 * @returns {{ findings: string[]; examined: number }}
 */
function auditWithCoverage(corpus) {
  /** @type {string[]} */
  const findings = [];
  let examined = 0;

  for (const [rel, text] of corpus) {
    if (!rel.startsWith("method/") || !rel.endsWith(".md")) continue;
    const ownsRules = /^##\s+The rules\s*$/m.test(text);
    const own = numberedItems(text);

    /** @type {Set<string>} */
    const qualifiedSpans = new Set();
    for (const m of text.matchAll(QUALIFIED)) {
      qualifiedSpans.add(m[0]);
      const target = resolveFile(corpus, /** @type {string} */ (m[1]));
      if (target === null) {
        findings.push(`${rel} cites "${m[0].trim()}" but ${m[1]} is not a file in method/`);
        continue;
      }
      const have = numberedItems(/** @type {string} */ (corpus.get(target)));
      for (const n of ordinals(/** @type {string} */ (m[2]))) {
        examined += 1;
        if (!have.has(n)) {
          findings.push(
            `${rel} cites ${m[1]} rule ${n}, and ${target} has no rule ${n} ` +
              `(its numbered rules are ${[...have].sort((a, b) => a - b).join(", ")})`,
          );
        }
      }
    }

    if (!ownsRules) continue;
    for (const m of text.matchAll(BARE)) {
      if ([...qualifiedSpans].some((span) => span.includes(m[0]))) continue;
      for (const n of ordinals(/** @type {string} */ (m[1]))) {
        examined += 1;
        if (!own.has(n)) {
          findings.push(
            `${rel} refers to its own rule ${n}, which it does not have ` +
              `(its numbered rules are ${[...own].sort((a, b) => a - b).join(", ")})`,
          );
        }
      }
    }
  }
  return { findings, examined };
}

/** @param {import("../lib/corpus.mjs").Corpus} c @returns {string[]} */
const audit = (c) => auditWithCoverage(c).findings;

/** @type {import("../lib/harness.mjs").ModelFreeEval} */
export default {
  id: "MF-02",
  kind: "model-free",
  title: "every numbered-rule citation resolves to a rule that exists",
  contract: "method/lane-protocol.md and the role files — a rule cited by ordinal is a rule that exists",
  reads: ["method/**/*.md"],

  async check() {
    const { findings, examined } = auditWithCoverage(readCorpus());
    if (examined === 0) {
      throw new Error(
        "no rule citation was examined at all — the corpus is empty, the citation " +
          "shapes have changed, or this audit has quietly stopped looking",
      );
    }
    if (findings.length > 0) {
      return {
        ok: false,
        detail: `${findings.length} of ${examined} rule citations do not resolve`,
        lines: findings,
      };
    }
    return { ok: true, detail: `${examined} rule citations, all resolving` };
  },

  async degrade() {
    const clean = readCorpus();
    // Renumber the LAST rule of the lane protocol. That is the mutation a
    // real edit makes for free: insert a rule anywhere and every ordinal
    // after it moves, while every citation of the old numbers keeps its
    // confident shape.
    const protocol = /** @type {string} */ (clean.get("method/lane-protocol.md"));
    const last = Math.max(...numberedItems(protocol));
    const broken = degraded(clean, "method/lane-protocol.md", (t) =>
      t.replace(new RegExp(`^${last}\\. `, "m"), `${last + 1}. `),
    );
    return control({
      clean,
      broken,
      audit,
      names: (f) => f.includes(`rule ${last}`),
      what: `renumbering lane-protocol rule ${last} to ${last + 1}`,
    });
  },
};
