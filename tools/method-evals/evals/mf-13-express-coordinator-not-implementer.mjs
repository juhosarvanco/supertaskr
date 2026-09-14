/**
 * MF-13 — the coordinator's own role file says, in its own words, that
 * the seat coordinating an EXPRESS change is not that change's
 * implementer, and that the one edit a coordinator does make — an
 * assigned correction applied at the merge — still keeps the standing
 * comparison against verified content.
 *
 * THE RULE THIS HOLDS IS STATED IN THE METHOD AND NOT HERE (T-057: a rule
 * with two statements is two chances to disagree).
 * `method/roles/orchestrator.md`'s express step owns it; this eval holds
 * the text, because the text is the half a program can see.
 *
 * ── WHY THIS ONE NEEDS A GATE AT ALL ────────────────────────────────
 * Every other separation in this method is bought by a SEAT: the builder
 * of a cage is not its inspector, the verifier is a fresh session, the
 * merge is the owner's gate. The express path removes the verifier by
 * design — that is what the bounded tier BUYS — and what is then left
 * holding the separation between whoever decides a change is wanted and
 * whoever makes it is one sentence in one role file. A sentence with
 * nothing in front of it is exactly the kind of clause a later rewrite
 * shortens for flow, and the day it goes the express path becomes a
 * coordinator editing code on its own authorization with no verifier and
 * no reviewer. That is not a style preference; it is the whole failure
 * `review:` exists to stop, arriving through a door marked speed.
 *
 * ── WHY EACH CLAUSE IS ONE THE EVAL REQUIRES SEPARATELY ─────────────
 *
 *   THE NON-IMPLEMENTER CLAUSE. Without it there is no rule at all.
 *
 *   THE COORDINATOR'S ONE EDIT. A rule that said only "the seat edits no
 *   code" would be false the first time a coordinator applies an assigned
 *   correction at a merge, and a rule a reader has to break to do the job
 *   is a rule that gets ignored whole rather than in part. So the text has
 *   to name the exception and BOUND it.
 *
 *   THE COMPARISON AGAINST VERIFIED CONTENT. The bound is the comparison
 *   the merge already owes (T-295-s9: an anchor that matches twice
 *   rewrites live code). The express label must not be read as evidence
 *   that the comparison is unnecessary, so the text says so.
 *
 * ── WHAT IS DELIBERATELY NOT COUNTED ────────────────────────────────
 * WHETHER A SEAT OBEYED IT. Whether the coordinator of a particular
 * express change edited the code is a fact about a session, and no file
 * records it. This eval holds the TEXT; the run records hold who was
 * assigned the work, and the diff holds who wrote it. A check that
 * claimed more than the text would be claiming to see a session.
 *
 * ── WHY IT CARRIES ITS OWN DISCRIMINATION PAIR ──────────────────────
 * The live scope is ONE file, so a `check()` over it alone reports a green
 * that means only "the sentence is still there". `check()` therefore also
 * runs the same audit over a role file with each clause removed in turn
 * and requires each removal to be caught by name. If the audit ever stops
 * discriminating, this eval FAILS saying so rather than riding a
 * one-file scope to a green (MF-11 and MF-12 state the same reason for
 * the same shape).
 */

import { control, degraded, readCorpus } from "../lib/corpus.mjs";

const ROLE = "method/roles/orchestrator.md";

/**
 * THE THREE CLAUSES, each a PHRASE the role file must carry and each with
 * the sentence saying what its absence costs. The phrases are short and
 * load-bearing rather than whole sentences: a rule pinned to a paragraph
 * verbatim is a rule nobody may improve the wording of, and this method's
 * own conventions say a pinned sentence is never reworded.
 */
export const CLAUSES = Object.freeze([
  Object.freeze({
    id: "not-the-implementer",
    phrase: "EDITS NO CODE UNDER THE EXPRESS LABEL",
    costs:
      "the express path removes the verifier by design, so this sentence is the whole of what " +
      "keeps whoever decides a change is wanted apart from whoever makes it",
  }),
  Object.freeze({
    id: "the-one-edit",
    phrase: "assigned correction applied at the merge",
    costs:
      "a rule that forbade every coordinator edit would be false the first time an assigned " +
      "correction is applied, and a rule a reader has to break to do the job is ignored whole",
  }),
  Object.freeze({
    id: "verified-content",
    phrase: "diffed against the verified content",
    costs:
      "an anchor that matches twice rewrites live code (T-295-s9), and an express label is not " +
      "evidence that it did not",
  }),
]);

/**
 * WHITESPACE COLLAPSED, because every document in this method is HARD
 * WRAPPED and a clause of six words crosses a line break as often as not.
 * A reader that matched the raw text would report a rule missing on the
 * day somebody reflowed the paragraph it sits in, which is a false red on
 * a gate whose whole value is that it never cries wolf.
 *
 * @param {string} text @returns {string}
 */
export function flatten(text) {
  return String(text).replace(/\s+/g, " ");
}

/**
 * The findings one corpus carries.
 *
 * @param {import("../lib/corpus.mjs").Corpus} corpus
 * @returns {string[]}
 */
export function audit(corpus) {
  /** @type {string[]} */
  const findings = [];
  const raw = corpus.get(ROLE);
  if (raw === undefined) {
    findings.push(`${ROLE} is not in the corpus at all, so the express rule cannot be read`);
    return findings;
  }
  const text = flatten(raw);
  for (const clause of CLAUSES) {
    if (text.includes(clause.phrase)) continue;
    findings.push(
      `${ROLE} no longer carries ${JSON.stringify(clause.phrase)} (${clause.id}). ${clause.costs}.`,
    );
  }
  return findings;
}

/**
 * REWORD A CLAUSE IN THE RAW, WRAPPED TEXT. The audit reads a flattened
 * copy and the degradation has to edit the FILE, so the phrase is matched
 * with its own spaces allowed to be any whitespace — which is the same
 * hard-wrap allowance from the other side.
 *
 * @param {string} text @param {string} phrase @param {string} instead
 * @returns {string}
 */
export function reword(text, phrase, instead) {
  const pattern = new RegExp(
    phrase.split(/\s+/).map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("\\s+"),
    "g",
  );
  return text.replace(pattern, instead);
}

/**
 * The discrimination set: the live file must come back clean, and each
 * clause removed on its own must be caught BY NAME.
 *
 * @returns {{ ok: true, detail: string } | { ok: false, detail: string, lines: string[] }}
 */
function discriminates() {
  const clean = readCorpus();
  const base = audit(clean);
  /** @type {string[]} */
  const missed = [];
  for (const clause of CLAUSES) {
    const broken = degraded(clean, ROLE, (t) => reword(t, clause.phrase, "a reworded line"));
    const found = audit(broken).filter((f) => f.includes(clause.id));
    if (found.length === 0) missed.push(clause.id);
  }
  if (base.length > 0 || missed.length > 0) {
    return {
      ok: false,
      detail:
        "THE DISCRIMINATION SET NO LONGER DISCRIMINATES, so a green over the live role file would " +
        `mean nothing: the undegraded file produced ${String(base.length)} finding(s) and ` +
        `${missed.length === 0 ? "every clause was caught" : `these clauses were MISSED: ${missed.join(", ")}`}`,
      lines: base,
    };
  }
  return {
    ok: true,
    detail: `${String(CLAUSES.length)} clause(s), each caught by name when removed on its own`,
  };
}

/** @type {import("../lib/harness.mjs").ModelFreeEval} */
export default {
  id: "MF-13",
  kind: "model-free",
  title: "the coordinator of an express change is not its implementer, and the one edit it does make is bounded",
  contract: `${ROLE} — the express step's three clauses`,
  reads: [ROLE],

  async check() {
    const pair = discriminates();
    if (!pair.ok) return pair;
    const findings = audit(readCorpus());
    if (findings.length > 0) {
      return { ok: false, detail: `${findings.length} clause(s) missing from ${ROLE}`, lines: findings };
    }
    return {
      ok: true,
      detail: `${ROLE} carries all ${String(CLAUSES.length)} clauses; ${pair.detail}`,
    };
  },

  async degrade() {
    const clean = readCorpus();
    // THE DEGRADATION IS THE ONE SOMEBODY WOULD ACTUALLY MAKE: not a
    // deletion of the rule, but a REWORDING that keeps the paragraph and
    // drops the clause that does the work — which is how a bound becomes
    // an aspiration without anybody deciding to remove it.
    const clause = /** @type {{ phrase: string, id: string }} */ (CLAUSES[0]);
    const broken = degraded(clean, ROLE, (t) =>
      reword(t, clause.phrase, "USUALLY LEAVES THE CODE TO THE EXECUTOR"),
    );
    return control({
      clean,
      broken,
      audit,
      names: (f) => f.includes(clause.id),
      what: "the coordinator's non-implementer clause softened into a preference",
    });
  },
};
