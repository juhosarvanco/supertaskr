/**
 * MF-06 — every review claim in the founding corpus still settles the way
 * the record says it settled.
 *
 * THIS IS THE COST OF KEEPING A CORPUS, PAID IN ADVANCE. A fixture that
 * teaches a lesson the world has since stopped supporting is worse than
 * no fixture: it is a citation that reads as evidence. `T-108` spent a
 * whole card on three such citations in the archive. So the model-free
 * half of the review-claim family re-runs every derivation and requires
 * the settlement to match the recorded verdict — the corpus checks
 * itself before it is used to check anything else.
 *
 * IT IS ALSO THE ONLY HONEST WAY TO SCORE THE MODEL-IN-LOOP HALF. MIL-04
 * hands these claims to a model and asks whether it RE-DERIVES rather
 * than agrees. That score is meaningless if the derivation it is scored
 * against no longer settles — a model would be marked wrong for being
 * right about a world the fixture has not noticed changing.
 *
 * WHAT A FAILURE HERE MEANS, said plainly because the two readings send a
 * reader to opposite repairs: either the recorded verdict was wrong when
 * it was written, or the world moved. Both are findings. Neither is
 * fixed by editing the verdict until it agrees.
 */

import { REVIEW_CLAIMS } from "../fixtures/review-claims.mjs";

/**
 * @param {typeof REVIEW_CLAIMS} claims
 * @returns {string[]}
 */
function audit(claims) {
  /** @type {string[]} */
  const findings = [];
  for (const claim of claims) {
    /** @type {import("../fixtures/review-claims.mjs").Settlement} */
    let settlement;
    try {
      settlement = claim.derive();
    } catch (cause) {
      findings.push(
        `${claim.id}: its derivation would not run — ${cause instanceof Error ? cause.message : String(cause)}`,
      );
      continue;
    }
    if (settlement.settled !== claim.verdict) {
      findings.push(
        `${claim.id}: recorded ${claim.verdict}, re-derived ${settlement.settled} — ` +
          `${settlement.evidence}. Either the record was wrong or the world moved; ` +
          "do not repair it by editing the verdict.",
      );
    }
    if (settlement.evidence.trim() === "") {
      findings.push(`${claim.id}: settled ${settlement.settled} with NO evidence — an empty comparison reports agreement`);
    }
  }
  return findings;
}

/** @type {import("../lib/harness.mjs").ModelFreeEval} */
export default {
  id: "MF-06",
  kind: "model-free",
  title: "the review-claim corpus re-derives the way the record says it did",
  contract:
    "tools/method-evals/fixtures/review-claims.mjs — every claim's derivation is executable, " +
    "and its recorded verdict is what the derivation still settles",
  reads: ["tools/method-evals/fixtures/review-claims.mjs", "docs/CONVENTIONS.md"],

  async check() {
    if (REVIEW_CLAIMS.length === 0) {
      throw new Error("the review-claim corpus is empty — an empty corpus is not a settled one");
    }
    const findings = audit(REVIEW_CLAIMS);
    if (findings.length > 0) {
      return {
        ok: false,
        detail: `${findings.length} of ${REVIEW_CLAIMS.length} claims no longer settle as recorded`,
        lines: findings,
      };
    }
    return {
      ok: true,
      detail: `${REVIEW_CLAIMS.length} claims re-derived, every settlement matching its record`,
      lines: REVIEW_CLAIMS.map((c) => `${c.id} ${c.verdict}: ${c.derive().evidence}`),
    };
  },

  async degrade() {
    const baseline = audit(REVIEW_CLAIMS);
    if (baseline.length > 0) {
      throw new Error(
        `the corpus already reports ${baseline.length} finding(s), so a red under the ` +
          `mutation would prove nothing. First: ${baseline[0]}`,
      );
    }
    // Flip ONE recorded verdict, on a copy. The mutation is one-sided by
    // construction: the derivation is untouched, so nothing moves on both
    // sides at once and a symmetric green is impossible here.
    const subject = /** @type {typeof REVIEW_CLAIMS[number]} */ (REVIEW_CLAIMS[0]);
    const flipped = REVIEW_CLAIMS.map((c) =>
      c.id === subject.id
        ? { ...c, verdict: /** @type {"REFUTED" | "CONFIRMED"} */ (c.verdict === "REFUTED" ? "CONFIRMED" : "REFUTED") }
        : c,
    );
    const found = audit(flipped);
    const hit = found.filter((f) => f.startsWith(`${subject.id}:`));
    if (hit.length === 0) {
      return {
        ok: false,
        detail: `flipping ${subject.id}'s recorded verdict was NOT detected — the corpus agrees with itself whatever it says`,
        lines: found.slice(0, 4),
      };
    }
    return { ok: true, detail: `flipping ${subject.id}'s recorded verdict is detected` };
  },
};
