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
 * AND SINCE T-205-s1 THE MATRIX AND THE JUDGES HAVE A SECOND READER.
 * `tools/method-evals/verdict-digest.mjs` is the CHECKER that runs this
 * comparison against a REAL verdict and a REAL saved file, and `MF-10` runs
 * THIS matrix through that checker's whole walk — so a row this eval holds
 * and the walk loses is caught by name. `CITATION`, `judge`, `matrix` and
 * the three degraded judges are exported for that reader and for no other
 * reason; the comparison is still written once (`T-057`).
 *
 * AND THE POSITIVE CONTROL IS THE MATRIX RUN AGAINST IMPLEMENTATIONS
 * THAT LACK THE PROPERTY (`docs/CONVENTIONS.md`'s A NEGATIVE ASSERTION
 * NEEDS A POSITIVE CONTROL, and the `--selftest` shape it names): three
 * wrong judges — presence, prefix, fail-open — each of which passes the
 * happy path, plus a softening of the method sentence itself. The
 * degradation is applied where the subject's arming is ABSENT, so no
 * single arrangement decides both the subject's answer and the control's.
 *
 * THE TEXT ARM USED TO CARRY A CONJUNCT THAT COULD NOT FAIL (`T-205-s7`,
 * absorbed into `T-205-s4`). The command half was written as a
 * WHOLE-DOCUMENT presence test — `/shasum -a 256/.test(conv)` — and
 * `docs/CONVENTIONS.md` has carried that command since long before
 * `T-205`, in the POISON DRILL bullet, which has nothing to do with
 * attack-set digests. Measured at `48285b5`: replacing the attack-set
 * bullet's own `` `shasum -a 256 <file>` `` with the words *"the usual
 * hashing command"* left the suite at exit 0. `T-057` is this project's
 * name for exactly that, and `roles/verifier.md` step 2b calls a control
 * that grades every arrangement the same the defect this method produces
 * most. So the command test is now SCOPED TO THE BULLET that documents
 * the citation — the bullet is found by the GRAMMAR it spells, never by
 * a byte-exact sentence, so rewording it survives and moving the command
 * off it does not — and the strike has a degradation arm of its own.
 */

import { createHash } from "node:crypto";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { conventionsPaths, readCorpus } from "../lib/corpus.mjs";

/** The one citation grammar, the same one docs/CONVENTIONS.md spells. */
export const CITATION = /attack set:\s*sha256:([0-9a-f]{64})\b/i;

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
export function presenceJudge(verdict, file) {
  void file;
  return CITATION.test(verdict)
    ? { verdict: /** @type {const} */ ("ACCEPT"), reason: "a digest is cited" }
    : { verdict: /** @type {const} */ ("REFUSE"), reason: "no digest cited" };
}

/** A degraded judge: resemblance instead of equality. */
/** @param {string} verdict @param {string} file */
export function prefixJudge(verdict, file) {
  const m = /attack set:\s*sha256:([0-9a-f]+)/i.exec(verdict);
  if (m === null) return { verdict: /** @type {const} */ ("REFUSE"), reason: "no digest cited" };
  const actual = sha256(readFileSync(file, "utf8"));
  return actual.startsWith(/** @type {string} */ (m[1]).toLowerCase())
    ? { verdict: /** @type {const} */ ("ACCEPT"), reason: "the citation is a prefix" }
    : { verdict: /** @type {const} */ ("REFUSE"), reason: "no match" };
}

/** A degraded judge: nothing to compare against, so let it through. */
/** @param {string} verdict @param {string} file */
export function failOpenJudge(verdict, file) {
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
export function matrix(subject) {
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

/** The digest command docs/CONVENTIONS.md spells, and the only one this platform has. */
export const DIGEST_COMMAND = /shasum -a 256/;

/**
 * The top-level bullets of a markdown document, each as its own text.
 *
 * A bullet runs from its `- ` opener to the next top-level bullet, the
 * next heading, or the next unindented paragraph. This is the unit the
 * command test is scoped to, and the reason it is a UNIT rather than a
 * sentence: `T-205-s7` measured a whole-document presence test being
 * satisfied by a bullet 1,400 lines away, and a byte-exact sentence test
 * would only have traded that hole for brittleness to rewording.
 *
 * @param {string} doc
 * @returns {string[]}
 */
export function topLevelBullets(doc) {
  /** @type {string[]} */
  const bullets = [];
  /** @type {string[] | null} */
  let current = null;
  for (const line of doc.split("\n")) {
    if (/^-\s/.test(line)) {
      if (current !== null) bullets.push(current.join("\n"));
      current = [line];
    } else if (/^#{1,6}\s/.test(line) || /^[^\s-]/.test(line)) {
      if (current !== null) bullets.push(current.join("\n"));
      current = null;
    } else if (current !== null) {
      current.push(line);
    }
  }
  if (current !== null) bullets.push(current.join("\n"));
  return bullets;
}

/**
 * The bullet that DOCUMENTS the attack-set citation — found by the
 * grammar it spells, so it is the bullet's job that identifies it and not
 * its wording. `<hex>` is the document's placeholder for the digest, and
 * every occurrence is filled so the grammar reads as it would in a real
 * verdict.
 *
 * @param {string} doc
 * @returns {string | null}
 */
export function attackSetBullet(doc) {
  for (const bullet of topLevelBullets(doc)) {
    const flat = bullet.replace(/\s+/g, " ").replace(/<hex>/g, "0".repeat(64));
    if (CITATION.test(flat)) return bullet;
  }
  return null;
}

/** The four method sentences this eval holds, read off the corpus. */
/** @param {import("../lib/corpus.mjs").Corpus} corpus @returns {string[]} */
function textFindings(corpus) {
  /** @type {string[]} */
  const findings = [];
  const flat = (/** @type {string} */ rel) => (corpus.get(rel) ?? "").replace(/\s+/g, " ");
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
  // THE LINE, AND THEN THE COMMAND ON THAT SAME BULLET — two findings and
  // not one conjunction, because a conjunct whose other half is satisfied
  // somewhere else in the document is a conjunct that cannot fail
  // (`T-205-s7`). Each half now names what is missing.
  // THE INDEX AND ITS CHAPTERS, NEVER THE INDEX ALONE (T-290's verifier):
  // docs/CONVENTIONS.md points at docs/conventions/, the bullet carrying
  // this grammar lives in one of those chapters, and a search of the
  // index by itself finds a POINTER where the rule used to be.
  const bullet = conventionsPaths()
    .map((rel) => attackSetBullet(corpus.get(rel) ?? ""))
    .find((b) => b !== null) ?? null;
  if (bullet === null) {
    findings.push(
      "no bullet in docs/CONVENTIONS.md or the chapters it points at spells the line a " +
        "verdict cites the digest on (`attack set: sha256:<hex> (<file>)`), so the " +
        "grammar this eval parses is a grammar nobody documents",
    );
  } else if (!DIGEST_COMMAND.test(bullet.replace(/\s+/g, " "))) {
    findings.push(
      "this project's conventions document the attack-set citation but spell no " +
        "`shasum -a 256` on THAT bullet, so the digest a verdict cites has no command " +
        "behind it — a `shasum` mention on some other bullet documents some other hash",
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
  reads: ["method/**/*.md", "docs/CONVENTIONS.md", "docs/conventions/*.md"],

  async check() {
    const findings = [...textFindings(readCorpus(conventionsPaths()))];
    const wrong = matrix(judge);
    for (const w of wrong) findings.push(`the refusal does not hold — ${w}`);
    if (findings.length > 0) {
      return { ok: false, detail: `${findings.length} finding(s)`, lines: findings };
    }
    return { ok: true, detail: "5 matrix rows hold, and the four method sentences are in place" };
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

    // AND THE COMMAND ARM (`T-205-s7`): strike the digest command from the
    // bullet that documents the citation, leaving every OTHER `shasum -a
    // 256` in the document exactly where it was, and require the eval to
    // notice. This is the control the old whole-document conjunct never
    // had — and the assertion that the surviving mentions do NOT satisfy
    // the check is the half that makes it a control rather than a
    // rewording of the subject.
    const convClean = /** @type {string} */ (clean.get("docs/CONVENTIONS.md"));
    const documenting = attackSetBullet(convClean);
    if (documenting === null) {
      arms.push({ ok: false, line: "no bullet documents the attack-set citation to strike from" });
    } else {
      const struck = documenting.replace(/`?shasum -a 256[^`\n]*`?/, "the usual hashing command");
      if (struck === documenting) {
        arms.push({ ok: false, line: "striking the digest command from its bullet changed nothing" });
      } else {
        const convBroken = convClean.replace(documenting, struck);
        const elsewhere = (convBroken.match(/shasum -a 256/g) ?? []).length;
        const broken = new Map(clean);
        broken.set("docs/CONVENTIONS.md", convBroken);
        const found = textFindings(broken).filter((f) => f.includes("shasum -a 256"));
        arms.push(
          found.length > 0 && elsewhere > 0
            ? {
                ok: true,
                line:
                  `striking the digest command from the bullet that documents the citation ` +
                  `is detected while ${elsewhere} unrelated \`shasum -a 256\` mention(s) ` +
                  `survive elsewhere in the document: ${found[0]}`,
              }
            : {
                ok: false,
                line:
                  elsewhere === 0
                    ? "the strike removed EVERY `shasum -a 256` in the document, so this " +
                      "arm cannot tell a scoped check from a whole-document one"
                    : "striking the digest command from its own bullet was NOT detected — " +
                      "the command test is still satisfied from somewhere else",
              },
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
