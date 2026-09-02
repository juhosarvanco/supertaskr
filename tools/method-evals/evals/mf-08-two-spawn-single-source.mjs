/**
 * MF-08 — the two-spawn verification shape is DECLARED in exactly one
 * method file, and `roles/verifier.md` points at it rather than
 * restating it.
 *
 * WHY THIS IS A REAL FAILURE AND NOT A TIDINESS CHECK. `T-205` replaced
 * an honour system with a construction: phase 1 is its own spawn holding
 * no file, git or shell tools, so blindness stops depending on a seat
 * declining to look. **A construction is only as good as its single
 * statement.** The shape was previously spread across three role files —
 * `roles/verifier.md` step 0 described the phases, `roles/executor.md`'s
 * brief rules described the leak, `roles/orchestrator.md` 5c described
 * the schedule — and the three disagreed about whether the blindness was
 * a property or a discipline. That is `T-057` exactly: a rule with two
 * statements is two chances to disagree, and the method's own answer is
 * one home plus pointers.
 *
 * THE TWO HALVES, AND WHY BOTH ARE NEEDED. Counting DECLARATIONS catches
 * the copy that drifts. Requiring the POINTER catches the other
 * direction — a home nobody references is a rule stated once and read
 * never, and `roles/verifier.md` is the file whose reader most needs it,
 * because that reader is the seat the construction is built around.
 *
 * THE SHAPE THIS DELIBERATELY CANNOT SEE, named out loud rather than
 * implied (MF-04's own header takes the same discipline for a bare
 * filename): a PARAPHRASE. The declaration is recognised by two
 * independent signals in one file — that phase 1 IS ITS OWN SPAWN, and
 * that it holds NO FILE, GIT OR SHELL TOOLS — so a second statement
 * written in different words is not counted and this eval stays green
 * over it. Widening the predicate to semantic equivalence is not a
 * regex's job; what this buys is that the ordinary duplication — a
 * paragraph COPIED, which is how the three-file spread happened the
 * first time — cannot survive. The count is REPORTED on every pass so a
 * predicate that has quietly stopped matching is visible as a zero.
 */

import { readCorpus } from "../lib/corpus.mjs";

/** The file the shape is expected to live in, DERIVED rather than pinned. */
const POINTER_FILE = "method/roles/verifier.md";

/**
 * Every method file that DECLARES the tool-less phase-1 spawn.
 *
 * @param {import("../lib/corpus.mjs").Corpus} corpus
 * @returns {string[]}
 */
function declarers(corpus) {
  /** @type {string[]} */
  const out = [];
  for (const [rel, text] of corpus) {
    if (!rel.startsWith("method/") || !rel.endsWith(".md")) continue;
    const flat = text.replace(/\s+/g, " ");
    if (/PHASE 1 IS ITS OWN SPAWN/i.test(flat) && /no file, git or shell tools/i.test(flat)) {
      out.push(rel);
    }
  }
  return out;
}

/**
 * @param {import("../lib/corpus.mjs").Corpus} corpus
 * @returns {{ findings: string[]; homes: string[] }}
 */
function auditWithCoverage(corpus) {
  /** @type {string[]} */
  const findings = [];
  const homes = declarers(corpus);

  if (homes.length === 0) {
    findings.push(
      "no method file declares phase 1 as its own spawn holding no file, git or shell " +
        "tools — the blindness is a promise a seat makes again, not a property",
    );
  } else if (homes.length > 1) {
    findings.push(
      `the two-spawn shape is declared in ${homes.length} files (${homes.join(", ")}) — ` +
        "T-057: a rule with two statements is two chances to disagree",
    );
  }

  const pointer = corpus.get(POINTER_FILE);
  if (pointer === undefined) {
    findings.push(`${POINTER_FILE} is not in the method tree, so nothing can point at the home`);
    return { findings, homes };
  }
  const pointerFlat = pointer.replace(/\s+/g, " ");
  // THE POINTER IS DERIVED FROM THE HOME, never written down here: the
  // home's own basename is what a citation of it has to contain, so a
  // renamed or relocated home makes this half fail rather than pass.
  if (homes.length === 1 && homes[0] !== POINTER_FILE) {
    const home = /** @type {string} */ (homes[0]);
    const cite = home.replace(/^method\//, "");
    if (!pointerFlat.includes(cite)) {
      findings.push(
        `${POINTER_FILE} never names ${cite}, so the one place the shape is stated is a ` +
          "place the seat it governs is not sent to",
      );
    }
  }
  return { findings, homes };
}

/** @param {import("../lib/corpus.mjs").Corpus} c @returns {string[]} */
const audit = (c) => auditWithCoverage(c).findings;

/**
 * One degradation, run against the SAME audit over a corpus with one
 * entry replaced. The baseline is asserted clean first: a red under a
 * mutation proves nothing where the undegraded corpus was already red.
 *
 * @param {import("../lib/corpus.mjs").Corpus} clean
 * @param {string} rel
 * @param {(t: string) => string} mutate
 * @param {(f: string) => boolean} names
 * @param {string} what
 * @returns {{ ok: boolean; line: string }}
 */
function arm(clean, rel, mutate, names, what) {
  const before = clean.get(rel);
  if (before === undefined) return { ok: false, line: `${what}: ${rel} is not in the corpus` };
  const after = mutate(before);
  if (after === before) return { ok: false, line: `${what}: the degradation changed nothing` };
  const broken = new Map(clean);
  broken.set(rel, after);
  const found = audit(broken).filter(names);
  return found.length > 0
    ? { ok: true, line: `${what} is detected: ${found[0]}` }
    : { ok: false, line: `${what} was NOT detected` };
}

/** @type {import("../lib/harness.mjs").ModelFreeEval} */
export default {
  id: "MF-08",
  kind: "model-free",
  title: "the two-spawn shape is declared once and the verifier is pointed at it",
  contract:
    "method/roles/** — T-205's construction is stated in exactly one file, and " +
    "roles/verifier.md cites that file instead of restating it (T-057)",
  reads: ["method/**/*.md"],

  async check() {
    const { findings, homes } = auditWithCoverage(readCorpus());
    if (findings.length > 0) {
      return {
        ok: false,
        detail: `${findings.length} finding(s) against the single-source rule`,
        lines: findings,
      };
    }
    return {
      ok: true,
      detail: `declared once, in ${homes[0]}, and ${POINTER_FILE} points at it`,
    };
  },

  async degrade() {
    const clean = readCorpus();
    const baseline = audit(clean);
    if (baseline.length > 0) {
      throw new Error(
        `the UNDEGRADED corpus already reports ${baseline.length} finding(s), so this ` +
          `control has no baseline. First: ${baseline[0]}`,
      );
    }
    const home = /** @type {string} */ (declarers(clean)[0]);
    const cite = home.replace(/^method\//, "");

    // ARM ONE — THE COPY, which is how the spread happened the first
    // time: a paragraph pasted into the file whose reader wanted it
    // nearest to hand. Nothing about it looks wrong in either file.
    const copied = arm(
      clean,
      POINTER_FILE,
      (t) => `${t}\n     **PHASE 1 IS ITS OWN SPAWN, AND IT HAS NO FILE, GIT OR SHELL\n     TOOLS.**\n`,
      (f) => f.includes("declared in 2 files"),
      "the shape COPIED into the file that should only point at it",
    );

    // ARM TWO — THE POINTER STRUCK, which is what a tidying edit does:
    // the citation reads as clutter to somebody who already knows where
    // the rule lives, and the reader who does not is the one it was for.
    const unpointed = arm(
      clean,
      POINTER_FILE,
      (t) => t.split(cite).join("the dispatcher"),
      (f) => f.includes(`never names ${cite}`),
      "the pointer struck out of the file the construction governs",
    );

    const arms = [copied, unpointed];
    const bad = arms.filter((a) => !a.ok);
    if (bad.length > 0) {
      return {
        ok: false,
        detail: `${bad.length} of ${arms.length} degradation(s) went undetected`,
        lines: arms.map((a) => a.line),
      };
    }
    return { ok: true, detail: `${arms.length} degradations, both detected`, lines: arms.map((a) => a.line) };
  },
};
