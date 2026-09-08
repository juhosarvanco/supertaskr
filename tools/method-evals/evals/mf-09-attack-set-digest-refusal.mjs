/**
 * MF-09 — a verdict citing a digest that does not match the saved attack
 * set is REFUSED, and the refusal is DEMONSTRATED rather than asserted.
 *
 * THE SENTENCE THIS HOLDS. `roles/orchestrator.md` 5d says phase 1's
 * return is saved and hashed before phase 2 is spawned, that phase 2's
 * verdict cites that digest, and that **a verdict citing a digest that
 * does not match the saved file is REFUSED**. `roles/verifier.md` puts
 * the citation on the verifier and `docs/CONVENTIONS.md` spells the
 * command and the line. Three files, one contract — and until this eval
 * existed the contract had no reader at all, which `T-205`'s own card
 * called out as the difference between a mechanism and a sentence that
 * reads like one.
 *
 * WHY THE COMPARISON LIVES HERE AND NOT IN A LIBRARY. The subject is
 * eleven lines. What is worth having is not the eleven lines; it is the
 * MATRIX that decides whether any eleven lines are right, and the proof
 * that the matrix catches the wrong ones. A comparison written straight
 * into a checker somewhere and never degraded is exactly the guard-class
 * defect this project produces most (`roles/verifier.md` step 2b): four
 * in one sitting, each drilled, each read by a blind verifier, and the
 * fourth found inside the fix for the third.
 *
 * THE FOUR ROWS THAT ARE NOT THE HAPPY PATH, and why each is here
 * because a plausible implementation passes without it:
 *
 *   MISMATCH   a WELL-FORMED digest of DIFFERENT REAL content. Never an
 *              empty string and never `deadbeef`: a truthiness check
 *              refuses both of those and accepts this one, so a body
 *              built on a fake value certifies the wrong implementation.
 *   MISSING    the saved file gone. The tempting branch is *nothing to
 *              compare against, so skip* — which makes deleting the file
 *              the bypass. It refuses.
 *   ABSENT     no citation at all. A verdict that simply omits the line
 *              must not read as a verdict that matched.
 *   PREFIX     a truncated but correct leading run of the true digest. A
 *              `startsWith` or a shortened compare accepts it, and an
 *              attacker with a few characters of freedom is not an
 *              attacker at all — this is the row that separates equality
 *              from resemblance.
 *
 * AND THE POSITIVE CONTROL IS THE MATRIX RUN AGAINST IMPLEMENTATIONS
 * THAT LACK THE PROPERTY (`docs/CONVENTIONS.md`'s A NEGATIVE ASSERTION
 * NEEDS A POSITIVE CONTROL, and the `--selftest` shape it names): three
 * wrong judges — presence, prefix, fail-open — each of which passes the
 * happy path, plus a softening of the method sentence itself. The
 * degradation is applied where the subject's arming is ABSENT, so no
 * single arrangement decides both the subject's answer and the control's.
 */

import { createHash } from "node:crypto";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { readCorpus } from "../lib/corpus.mjs";

/** The one citation grammar, the same one docs/CONVENTIONS.md spells. */
const CITATION = /attack set:\s*sha256:([0-9a-f]{64})\b/i;

/** @param {string} s @returns {string} */
const sha256 = (s) => createHash("sha256").update(s, "utf8").digest("hex");

/**
 * THE SUBJECT. Judge a verdict's cited digest against the file it names.
 *
 * @param {string} verdict  the verdict text, which may or may not cite
 * @param {string} file     the saved attack set's path
 * @returns {{ verdict: "ACCEPT" | "REFUSE"; reason: string }}
 */
export function judge(verdict, file) {
  const m = CITATION.exec(verdict);
  if (m === null) {
    return { verdict: "REFUSE", reason: "the verdict cites no attack-set digest" };
  }
  const cited = /** @type {string} */ (m[1]).toLowerCase();
  /** @type {string} */
  let actual;
  try {
    actual = sha256(readFileSync(file, "utf8"));
  } catch (cause) {
    // FAIL CLOSED. An unreadable saved file is a refusal and never a
    // skip; the skip makes deleting the file the way past the check.
    return {
      verdict: "REFUSE",
      reason: `the saved attack set at ${file} could not be read: ${
        cause instanceof Error ? cause.message : String(cause)
      }`,
    };
  }
  if (cited !== actual) {
    return { verdict: "REFUSE", reason: `cited ${cited} against a file that hashes to ${actual}` };
  }
  return { verdict: "ACCEPT", reason: `the citation matches ${file}` };
}

/** A degraded judge: does the verdict carry SOMETHING digest-shaped? */
/** @param {string} verdict @param {string} file */
function presenceJudge(verdict, file) {
  void file;
  return CITATION.test(verdict)
    ? { verdict: /** @type {const} */ ("ACCEPT"), reason: "a digest is cited" }
    : { verdict: /** @type {const} */ ("REFUSE"), reason: "no digest cited" };
}

/** A degraded judge: resemblance instead of equality. */
/** @param {string} verdict @param {string} file */
function prefixJudge(verdict, file) {
  const m = /attack set:\s*sha256:([0-9a-f]+)/i.exec(verdict);
  if (m === null) return { verdict: /** @type {const} */ ("REFUSE"), reason: "no digest cited" };
  const actual = sha256(readFileSync(file, "utf8"));
  return actual.startsWith(/** @type {string} */ (m[1]).toLowerCase())
    ? { verdict: /** @type {const} */ ("ACCEPT"), reason: "the citation is a prefix" }
    : { verdict: /** @type {const} */ ("REFUSE"), reason: "no match" };
}

/** A degraded judge: nothing to compare against, so let it through. */
/** @param {string} verdict @param {string} file */
function failOpenJudge(verdict, file) {
  const m = CITATION.exec(verdict);
  if (m === null) return { verdict: /** @type {const} */ ("REFUSE"), reason: "no digest cited" };
  /** @type {string} */
  let actual;
  try {
    actual = sha256(readFileSync(file, "utf8"));
  } catch {
    return { verdict: /** @type {const} */ ("ACCEPT"), reason: "no saved file to compare against" };
  }
  return /** @type {string} */ (m[1]).toLowerCase() === actual
    ? { verdict: /** @type {const} */ ("ACCEPT"), reason: "match" }
    : { verdict: /** @type {const} */ ("REFUSE"), reason: "mismatch" };
}

const SAVED =
  "# attack set — T-900\n1. the criterion is met by a constant\n2. the control cannot fail\n";
const OTHER = "# attack set — T-901\n1. a different set entirely\n";

/**
 * Run the matrix against one judge and report which rows it got wrong.
 *
 * @param {(v: string, f: string) => { verdict: string; reason: string }} subject
 * @returns {string[]}  a line per row whose outcome was wrong; empty is correct
 */
function matrix(subject) {
  const dir = mkdtempSync(path.join(tmpdir(), "supertaskr-mf09-"));
  const file = path.join(dir, "attack-set-T-900.md");
  const gone = path.join(dir, "attack-set-T-902.md");
  try {
    writeFileSync(file, SAVED);
    const truth = sha256(SAVED);
    const rows = [
      { row: "MATCH", verdict: `attack set: sha256:${truth} (${file})`, file, want: "ACCEPT" },
      { row: "MISMATCH", verdict: `attack set: sha256:${sha256(OTHER)} (${file})`, file, want: "REFUSE" },
      { row: "MISSING", verdict: `attack set: sha256:${truth} (${gone})`, file: gone, want: "REFUSE" },
      { row: "ABSENT", verdict: "APPROVED. Everything looked fine.", file, want: "REFUSE" },
      {
        row: "PREFIX",
        verdict: `attack set: sha256:${truth.slice(0, 16)} (${file})`,
        file,
        want: "REFUSE",
      },
    ];
    /** @type {string[]} */
    const wrong = [];
    for (const r of rows) {
      /** @type {{ verdict: string; reason: string }} */
      let got;
      try {
        got = subject(r.verdict, r.file);
      } catch (cause) {
        // A JUDGE THAT THROWS IS A WRONG JUDGE, NOT A CRASHED HARNESS.
        // An unreadable saved file is the MISSING row, and a checker that
        // dies on it refuses nothing — it takes the run down and leaves
        // whoever re-runs it to decide what the exit meant.
        wrong.push(
          `${r.row}: wanted ${r.want}, the subject THREW — ` +
            `${cause instanceof Error ? cause.message : String(cause)}`,
        );
        continue;
      }
      if (got.verdict !== r.want) {
        wrong.push(`${r.row}: wanted ${r.want}, got ${got.verdict} — ${got.reason}`);
      }
    }
    return wrong;
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

/** The three method sentences this eval holds, read off the corpus. */
/** @param {import("../lib/corpus.mjs").Corpus} corpus @returns {string[]} */
function textFindings(corpus) {
  /** @type {string[]} */
  const findings = [];
  const flat = (rel) => (corpus.get(rel) ?? "").replace(/\s+/g, " ");
  const declared = [...corpus.keys()].some(
    (rel) =>
      rel.startsWith("method/") &&
      /VERDICT CITING A HASH THAT DOES NOT MATCH THE SAVED FILE IS REFUSED/i.test(flat(rel)),
  );
  if (!declared) {
    findings.push(
      "no method file says a verdict citing a non-matching digest is REFUSED, so this " +
        "eval is enforcing a rule the method no longer makes",
    );
  }
  if (!/CITE ITS HASH IN YOUR VERDICT/i.test(flat("method/roles/verifier.md"))) {
    findings.push("method/roles/verifier.md does not put the citation on the verifier");
  }
  const conv = flat("docs/CONVENTIONS.md");
  if (!/shasum -a 256/.test(conv) || !CITATION.test(conv.replace("<hex>", "0".repeat(64)))) {
    findings.push(
      "docs/CONVENTIONS.md spells neither the digest command nor the line a verdict " +
        "cites it on, so the grammar this eval parses is a grammar nobody documents",
    );
  }
  return findings;
}

/** @type {import("../lib/harness.mjs").ModelFreeEval} */
export default {
  id: "MF-09",
  kind: "model-free",
  title: "a verdict citing a digest that does not match the saved attack set is refused",
  contract:
    "method/roles/orchestrator.md 5d + roles/verifier.md + docs/CONVENTIONS.md — the " +
    "attack set is hashed, the verdict cites the digest, and a mismatch is REFUSED",
  reads: ["method/**/*.md", "docs/CONVENTIONS.md"],

  async check() {
    const findings = [...textFindings(readCorpus(["docs/CONVENTIONS.md"]))];
    const wrong = matrix(judge);
    for (const w of wrong) findings.push(`the refusal does not hold — ${w}`);
    if (findings.length > 0) {
      return { ok: false, detail: `${findings.length} finding(s)`, lines: findings };
    }
    return { ok: true, detail: "5 matrix rows hold, and the three method sentences are in place" };
  },

  async degrade() {
    // BASELINE FIRST. A red under a degradation proves nothing where the
    // undegraded arrangement was already red.
    const baselineWrong = matrix(judge);
    if (baselineWrong.length > 0) {
      throw new Error(
        `the UNDEGRADED subject already fails ${baselineWrong.length} matrix row(s), so this ` +
          `control has no baseline. First: ${baselineWrong[0]}`,
      );
    }
    /** @type {{ ok: boolean; line: string }[]} */
    const arms = [];
    const judges = [
      { what: "a PRESENCE check — any digest-shaped string accepted", subject: presenceJudge, row: "MISMATCH" },
      { what: "a PREFIX compare — resemblance standing in for equality", subject: prefixJudge, row: "PREFIX" },
      { what: "a FAIL-OPEN missing-file branch — deleting the file is the bypass", subject: failOpenJudge, row: "MISSING" },
    ];
    for (const j of judges) {
      const wrong = matrix(j.subject);
      const hit = wrong.filter((w) => w.startsWith(j.row));
      arms.push(
        hit.length > 0
          ? { ok: true, line: `${j.what} is caught at ${hit[0]}` }
          : { ok: false, line: `${j.what} was NOT caught — ${wrong.length} row(s) wrong` },
      );
    }

    // AND THE TEXT ARM: soften the method's own sentence and require the
    // eval to notice that it is enforcing a rule nobody makes any more.
    const clean = readCorpus(["docs/CONVENTIONS.md"]);
    const home = [...clean.keys()].find(
      (rel) =>
        rel.startsWith("method/") &&
        /VERDICT CITING A HASH THAT DOES NOT MATCH THE SAVED\s+FILE IS REFUSED/i.test(
          /** @type {string} */ (clean.get(rel)),
        ),
    );
    if (home === undefined) {
      arms.push({ ok: false, line: "the sentence to soften is not in the corpus at all" });
    } else {
      const broken = new Map(clean);
      const before = /** @type {string} */ (clean.get(home));
      const after = before.replace(
        /VERDICT CITING A HASH THAT DOES NOT MATCH THE SAVED\s+FILE IS REFUSED/,
        "verdict should normally cite a digest that matches the saved file",
      );
      if (after === before) {
        arms.push({ ok: false, line: "softening the refusal sentence changed nothing" });
      } else {
        broken.set(home, after);
        const found = textFindings(broken).filter((f) => f.includes("REFUSED"));
        arms.push(
          found.length > 0
            ? { ok: true, line: `softening the refusal in ${home} is detected: ${found[0]}` }
            : { ok: false, line: `softening the refusal in ${home} was NOT detected` },
        );
      }
    }

    const bad = arms.filter((a) => !a.ok);
    if (bad.length > 0) {
      return {
        ok: false,
        detail: `${bad.length} of ${arms.length} degradation(s) went undetected`,
        lines: arms.map((a) => a.line),
      };
    }
    return {
      ok: true,
      detail: `${arms.length} degradations, all detected`,
      lines: arms.map((a) => a.line),
    };
  },
};
