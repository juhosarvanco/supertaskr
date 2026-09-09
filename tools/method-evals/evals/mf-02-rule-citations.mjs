/**
 * MF-02 — every ordinal citation in the method resolves to a rule, or to
 * a lettered sub-step, that exists in the file it names.
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
 * AND THE METHOD DOES NOT NUMBER EVERY STEP THAT WAY (`T-205-s4`). Its
 * role files carry LETTERED sub-steps — `roles/orchestrator.md` has `5b.`,
 * `5c.` and `5d.`, `roles/verifier.md` has `2b.` — and the citations of
 * those carry no `rule` keyword and no bare ordinal at all:
 * `roles/orchestrator.md 5d`, `` `roles/verifier.md` step 2b ``. Until
 * this eval read them, the `rule N` predicate simply did not match, so
 * those citations were NEVER EXAMINED — the same silent class MF-04's own
 * header names for a bare unprefixed filename, and the one that matters
 * most under `T-205`'s shape of *one statement, everything else points at
 * it* (`T-057`). Rename `5d`, or insert a step ahead of it, and two role
 * files quietly cite a step that is not there while every gate stays
 * green. That is what the LETTERED class below closes.
 *
 * WHAT IT RESOLVES, AND WHAT IT DELIBERATELY DOES NOT.
 *
 *   QUALIFIED   `<file>.md rule N` / `rules N, M` — resolved against the
 *               numbered items of THAT file. This is the whole point:
 *               `roles/integrator.md rule 1` is NOT a lane-protocol
 *               citation, and an eval that assumed one file owned every
 *               ordinal would be wrong about that line today.
 *   LETTERED    `<file>.md 5d`, `` `<file>.md` step 2b `` — resolved
 *               against the `^ {0,3}\d+[a-z]\.` items of THAT file. The
 *               file name is REQUIRED here and there is no bare form,
 *               for the reason the skipped class gives: `5d` on its own
 *               is two characters, and a predicate that hunts those
 *               through prose finds dates, list markers and version
 *               numbers. The keyword (`step`, `steps`, `sub-step`) is
 *               optional because the method writes it both ways.
 *   SELF        a bare `rule N` inside a file that owns a `## The rules`
 *               heading, resolved against its own list.
 *   SKIPPED     a bare `rule N` anywhere else. `roles/executor.md`'s "the
 *               brief's rule 2" points at an UNNUMBERED bullet list, so
 *               there is no ordinal to resolve; guessing at a referent is
 *               how a check starts answering a different question.
 *
 * The skipped class is why the coverage count is REPORTED on every pass,
 * and why the LETTERED coverage is counted and thrown on SEPARATELY. A
 * widened predicate that matches nothing is a quieter version of the hole
 * it closed: it would ride the numbered class's coverage to a green while
 * examining not one lettered citation.
 */

import { control, degraded, readCorpus } from "../lib/corpus.mjs";

const METHOD_DIRS = "roles|tasks|interview|rooms|runtime|adapters|docs-templates";

/** The cited path, shared by both predicates so they cannot drift (`T-057`). */
const FILE = String.raw`((?:\.\./)?(?:method/)?(?:(?:${METHOD_DIRS})/)?[\w.-]+\.md)`;

/** `<path>.md[,] rule(s) N[, M][ and M]` — the file first, the ordinals second. */
const QUALIFIED = new RegExp(
  String.raw`(?<![\w./-])${FILE},?\s+rules?\s+(\d+(?:\s*(?:,|and)\s*\d+)*)`,
  "gi",
);

/**
 * `<path>.md[`][,] [step ]5d` — a LETTERED sub-step, always qualified by
 * its file. `\x60` is a backtick, which a String.raw template cannot
 * carry literally; the method writes the file name in code ticks about
 * half the time and the tick sits between the name and the ordinal.
 */
const LETTERED = new RegExp(
  String.raw`(?<![\w./-])${FILE}\x60?,?\s+(?:(?:sub-)?steps?\s+)?(\d+[a-z])\b`,
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
 * The LETTERED sub-steps of a file's own top-level list — `5b.`, `2b.` —
 * lower-cased, because a citation may not match the definition's case.
 *
 * @param {string} text
 * @returns {Set<string>}
 */
function letteredItems(text) {
  /** @type {Set<string>} */
  const items = new Set();
  for (const line of text.split("\n")) {
    const m = /^ {0,3}(\d+[a-z])\.\s/.exec(line);
    if (m !== null) items.add(/** @type {string} */ (m[1]).toLowerCase());
  }
  return items;
}

/**
 * A LETTERED match whose ordinal OPENS its own line as a list item is the
 * sub-step's own DEFINITION, caught across a line break because the
 * separator may span one — `…see roles/orchestrator.md\n5d. **THE BENCH…`
 * reads as a citation to a regex and as a heading to a human. A
 * definition is not a citation of itself, and counting it as one would
 * inflate the coverage figure with the very lines it is meant to check.
 *
 * @param {string} text
 * @param {RegExpMatchArray} m
 * @returns {boolean}
 */
function isOwnDefinition(text, m) {
  const ord = /** @type {string} */ (m[2]);
  const at = /** @type {number} */ (m.index) + m[0].length - ord.length;
  const lineStart = text.lastIndexOf("\n", at - 1) + 1;
  return /^ {0,3}$/.test(text.slice(lineStart, at)) && /^\.\s/.test(text.slice(at + ord.length));
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
 * @returns {{ findings: string[]; examined: number; lettered: number }}
 */
function auditWithCoverage(corpus) {
  /** @type {string[]} */
  const findings = [];
  let examined = 0;
  let lettered = 0;

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

    for (const m of text.matchAll(LETTERED)) {
      if (isOwnDefinition(text, m)) continue;
      const ord = /** @type {string} */ (m[2]).toLowerCase();
      const target = resolveFile(corpus, /** @type {string} */ (m[1]));
      if (target === null) {
        findings.push(
          `${rel} cites sub-step ${ord} of "${m[1]}", which is not a file in method/`,
        );
        continue;
      }
      const have = letteredItems(/** @type {string} */ (corpus.get(target)));
      examined += 1;
      lettered += 1;
      if (!have.has(ord)) {
        findings.push(
          `${rel} cites ${m[1]} sub-step ${ord}, and ${target} has no sub-step ${ord} ` +
            `(its lettered sub-steps are ${[...have].sort().join(", ") || "none at all"})`,
        );
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
  return { findings, examined, lettered };
}

/** @param {import("../lib/corpus.mjs").Corpus} c @returns {string[]} */
const audit = (c) => auditWithCoverage(c).findings;

/**
 * Every method file that cites `<home> <ord>`, in corpus order. The
 * POSITIVE CONTROL derives its expectation from the corpus rather than
 * naming two files it would then be asserting against itself.
 *
 * @param {import("../lib/corpus.mjs").Corpus} corpus
 * @param {string} home  the cited file, root-relative
 * @param {string} ord   the lettered sub-step, lower-cased
 * @returns {string[]}
 */
function citersOf(corpus, home, ord) {
  /** @type {Set<string>} */
  const citers = new Set();
  for (const [rel, text] of corpus) {
    if (!rel.startsWith("method/") || !rel.endsWith(".md")) continue;
    for (const m of text.matchAll(LETTERED)) {
      if (isOwnDefinition(text, m)) continue;
      if (/** @type {string} */ (m[2]).toLowerCase() !== ord) continue;
      if (resolveFile(corpus, /** @type {string} */ (m[1])) === home) citers.add(rel);
    }
  }
  return [...citers];
}

/** The sub-step the LETTERED control renames, and the file that owns it. */
const CONTROL_HOME = "method/roles/orchestrator.md";
const CONTROL_ORD = "5d";

/** @type {import("../lib/harness.mjs").ModelFreeEval} */
export default {
  id: "MF-02",
  kind: "model-free",
  title: "every ordinal citation resolves to a rule or sub-step that exists",
  contract:
    "method/lane-protocol.md and the role files — a rule cited by ordinal, and a " +
    "sub-step cited by letter, is one that exists",
  reads: ["method/**/*.md"],

  async check() {
    const { findings, examined, lettered } = auditWithCoverage(readCorpus());
    if (examined === 0) {
      throw new Error(
        "no rule citation was examined at all — the corpus is empty, the citation " +
          "shapes have changed, or this audit has quietly stopped looking",
      );
    }
    if (lettered === 0) {
      throw new Error(
        "no LETTERED sub-step citation was examined — the method cites `5b`, `5c`, `5d` " +
          "and `step 2b` today, so a zero here is the widened predicate having stopped " +
          "matching, not the method having stopped citing. A predicate that matches " +
          "nothing is a quieter version of the hole it closed (T-205-s4)",
      );
    }
    if (findings.length > 0) {
      return {
        ok: false,
        detail: `${findings.length} of ${examined} ordinal citations do not resolve`,
        lines: findings,
      };
    }
    return {
      ok: true,
      detail: `${examined} ordinal citations, all resolving (${lettered} lettered sub-steps)`,
    };
  },

  async degrade() {
    const clean = readCorpus();

    // THE BASELINE, MEASURED AND REPORTED, NOT ASSUMED. The widened
    // predicate's own risk is that it starts matching ordinary prose, and
    // the answer to that is the finding count over the UNDEGRADED corpus
    // (T-205-s4's fourth criterion). `control` re-derives it per arm and
    // throws on a dirty one; this line is what makes the figure visible.
    const base = auditWithCoverage(clean);
    if (base.findings.length > 0) {
      throw new Error(
        `the UNDEGRADED corpus already reports ${base.findings.length} finding(s), so no ` +
          `arm below would prove anything. First: ${base.findings[0]}`,
      );
    }

    /** @type {{ ok: boolean; line: string }[]} */
    const arms = [
      {
        ok: true,
        line:
          `baseline: 0 findings over ${base.examined} citations examined, ` +
          `${base.lettered} of them lettered — the predicates match no ordinary prose`,
      },
    ];

    // ARM 1 — THE NUMBERED CLASS. Renumber the LAST rule of the lane
    // protocol. That is the mutation a real edit makes for free: insert a
    // rule anywhere and every ordinal after it moves, while every citation
    // of the old numbers keeps its confident shape.
    const protocol = /** @type {string} */ (clean.get("method/lane-protocol.md"));
    const last = Math.max(...numberedItems(protocol));
    const brokenNumbered = degraded(clean, "method/lane-protocol.md", (t) =>
      t.replace(new RegExp(`^${last}\\. `, "m"), `${last + 1}. `),
    );
    const numbered = control({
      clean,
      broken: brokenNumbered,
      audit,
      names: (f) => f.includes(`rule ${last}`),
      what: `renumbering lane-protocol rule ${last} to ${last + 1}`,
    });
    arms.push({ ok: numbered.ok, line: numbered.detail });

    // ARM 2 — THE LETTERED CLASS (T-205-s4). Rename the sub-step in its
    // HOME file, exactly as inserting a step ahead of it would, and
    // require the audit to name EVERY file that cited it. Naming one of
    // them is not the property: the whole point of a dangling pointer is
    // that each citing file is separately wrong, and a control satisfied
    // by the first would pass an audit that stopped after one.
    const citers = citersOf(clean, CONTROL_HOME, CONTROL_ORD);
    if (citers.length < 2) {
      arms.push({
        ok: false,
        line:
          `${CONTROL_HOME} ${CONTROL_ORD} is cited from ${citers.length} file(s) in the ` +
          `corpus, so there is no multi-citer sub-step to demonstrate against`,
      });
    } else {
      const renamed = `${CONTROL_ORD.slice(0, -1)}${String.fromCharCode(
        CONTROL_ORD.charCodeAt(CONTROL_ORD.length - 1) + 1,
      )}`;
      const brokenLettered = degraded(clean, CONTROL_HOME, (t) =>
        t.replace(new RegExp(`^${CONTROL_ORD}\\. `, "m"), `${renamed}. `),
      );
      const found = audit(brokenLettered).filter((f) => f.includes(`sub-step ${CONTROL_ORD}`));
      const missed = citers.filter((c) => !found.some((f) => f.startsWith(`${c} cites`)));
      arms.push(
        missed.length === 0
          ? {
              ok: true,
              line:
                `renaming ${CONTROL_HOME} ${CONTROL_ORD} to ${renamed} is detected: ` +
                `${found.length} finding(s), naming all ${citers.length} citing file(s) — ` +
                `${citers.join(", ")}`,
            }
          : {
              ok: false,
              line:
                `renaming ${CONTROL_HOME} ${CONTROL_ORD} to ${renamed} left ` +
                `${missed.length} citing file(s) unnamed: ${missed.join(", ")}`,
            },
      );
    }

    // ARM 3 — THE FALSE-POSITIVE ARM, and it is the one the widened
    // predicate actually owes. A lettered citation has no keyword, so the
    // separator has to span a line break — and the line break is where a
    // sub-step's own DEFINITION sits. Plant the hazard: end the line above
    // the definition with a DIFFERENT method file's name, so that reading
    // the definition as a citation would blame a file that has no such
    // sub-step. The audit must stay silent AND must still examine every
    // lettered citation it examined before — silence from a predicate that
    // stopped matching is not the property (`T-057`).
    const planted = degraded(clean, CONTROL_HOME, (t) =>
      t.replace(
        new RegExp(`^${CONTROL_ORD}\\. `, "m"),
        `the shape is stated in method/lane-protocol.md\n${CONTROL_ORD}. `,
      ),
    );
    const after = auditWithCoverage(planted);
    arms.push(
      after.findings.length === 0 && after.lettered === base.lettered
        ? {
            ok: true,
            line:
              `a file name ending the line above ${CONTROL_HOME}'s own ${CONTROL_ORD}. ` +
              `definition is read as a definition and not as a citation of ` +
              `lane-protocol.md: 0 findings, and all ${after.lettered} lettered citations ` +
              `still examined`,
          }
        : {
            ok: false,
            line:
              after.findings.length > 0
                ? `planting a file name above the ${CONTROL_ORD}. definition produced ` +
                  `${after.findings.length} spurious finding(s): ${after.findings[0]}`
                : `planting a file name above the ${CONTROL_ORD}. definition dropped the ` +
                  `lettered coverage from ${base.lettered} to ${after.lettered}, so the ` +
                  `silence is a dead predicate rather than a correct reading`,
          },
    );

    const bad = arms.filter((a) => !a.ok);
    if (bad.length > 0) {
      return {
        ok: false,
        detail: `${bad.length} of ${arms.length} control arm(s) did not hold`,
        lines: arms.map((a) => a.line),
      };
    }
    return {
      ok: true,
      detail: `${arms.length} control arms hold: a baseline, 2 degradations, 1 false positive`,
      lines: arms.map((a) => a.line),
    };
  },
};
