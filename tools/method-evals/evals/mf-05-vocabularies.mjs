/**
 * MF-05 — the method's own vocabularies and the code's are the same
 * vocabularies.
 *
 * `method/tasks/TASK-FORMAT.md` declares three closed sets in its
 * frontmatter block — the task statuses, the sizes, the review modes —
 * and `lib/parser/src/types.ts` declares the same three as frozen arrays.
 * They are the two ends of ADR-002's "files are the brain": the method
 * says what a card may say, the parser decides what a card may say, and
 * NOTHING TODAY COMPARES THEM.
 *
 * THE FAILURE IS ALREADY WRITTEN DOWN, WHICH IS WHY THIS EVAL EXISTS
 * RATHER THAN A SECOND OPINION ABOUT IT. docs/CONVENTIONS.md's
 * suggestion-triage gotcha says in as many words: *"ADDING A STATUS IS A
 * METHOD CHANGE, NOT A PARSE FIX"*, and the DOCS GATE bullet says the
 * gate READS the vocabulary out of `lib/parser/src/types.ts` *"rather
 * than restating it, so this tree has exactly ONE status vocabulary
 * (T-057 — a rule with two implementations is two chances to disagree)"*.
 * Both are true of the GATE and neither is true of the METHOD FILE: the
 * gate checks CARDS against the code, and TASK-FORMAT.md is checked
 * against nothing. A ninth status added to the method text ships, gets
 * copied into somebody's project, and reds only when a card finally uses
 * it — three layers from the edit, which is the DOCS GATE's own argument
 * for existing.
 *
 * WHY THIS IS NOT ITSELF A SECOND IMPLEMENTATION. It restates neither
 * set. It reads both and requires them equal; the day either side gains a
 * value legitimately, the fix is to move the other, which is the edit the
 * bullet above already demands.
 */

import { control, degraded, readCorpus } from "../lib/corpus.mjs";

const METHOD_FILE = "method/tasks/TASK-FORMAT.md";
const CODE_FILE = "lib/parser/src/types.ts";

/**
 * The `|`-separated vocabulary written in the comment on a frontmatter
 * field, including any comment-only continuation lines under it.
 *
 * @param {string} text
 * @param {string} field
 * @returns {string[]}
 */
function vocabularyFor(text, field) {
  const lines = text.split("\n");
  const start = lines.findIndex((l) => new RegExp(`^${field}:`).test(l));
  if (start === -1) return [];
  /** @type {string[]} */
  const comments = [];
  const head = /#\s*(.*)$/.exec(/** @type {string} */ (lines[start]));
  if (head === null) return [];
  comments.push(/** @type {string} */ (head[1]));
  for (let i = start + 1; i < lines.length; i += 1) {
    const line = /** @type {string} */ (lines[i]);
    const cont = /^\s+#\s*(.*)$/.exec(line);
    if (cont === null) break;
    comments.push(/** @type {string} */ (cont[1]));
  }
  return comments
    .join(" ")
    // Everything after an em dash is the field's EXPLANATION, and
    // everything inside parentheses is an aside — neither is a value.
    .split("—")[0]
    .replace(/\([^)]*\)/g, "")
    .split("|")
    .map((v) => v.trim())
    .filter((v) => v !== "");
}

/**
 * A frozen string array declared in the parser's types.
 *
 * @param {string} text
 * @param {string} name
 * @returns {string[]}
 */
function constantArray(text, name) {
  const m = new RegExp(String.raw`export const ${name}\s*=\s*\[([^\]]*)\]`).exec(text);
  if (m === null) return [];
  return [...(/** @type {string} */ (m[1])).matchAll(/['"]([^'"]+)['"]/g)].map((x) => /** @type {string} */ (x[1]));
}

/** The three pairs, each named by both of its ends. */
const PAIRS = [
  { what: "task statuses", field: "status", constant: "TASK_STATUSES" },
  { what: "task sizes", field: "size", constant: "TASK_SIZES" },
  { what: "review modes", field: "review", constant: "REVIEW_MODES" },
];

/**
 * @param {import("../lib/corpus.mjs").Corpus} corpus
 * @returns {{ findings: string[]; examined: number }}
 */
function auditWithCoverage(corpus) {
  const method = corpus.get(METHOD_FILE);
  const code = corpus.get(CODE_FILE);
  if (method === undefined || code === undefined) {
    throw new Error(`the corpus is missing ${method === undefined ? METHOD_FILE : CODE_FILE}`);
  }
  /** @type {string[]} */
  const findings = [];
  let examined = 0;

  for (const pair of PAIRS) {
    const fromMethod = vocabularyFor(method, pair.field);
    const fromCode = constantArray(code, pair.constant);
    if (fromMethod.length === 0 || fromCode.length === 0) {
      findings.push(
        `the ${pair.what} could not be read from ` +
          `${fromMethod.length === 0 ? `${METHOD_FILE}'s \`${pair.field}:\` comment` : `${CODE_FILE}'s ${pair.constant}`} ` +
          "— an unreadable side is not an agreeing side",
      );
      continue;
    }
    examined += 1;
    const onlyMethod = fromMethod.filter((v) => !fromCode.includes(v));
    const onlyCode = fromCode.filter((v) => !fromMethod.includes(v));
    if (onlyMethod.length > 0 || onlyCode.length > 0) {
      findings.push(
        `the ${pair.what} disagree: ${METHOD_FILE} has ` +
          `${onlyMethod.length > 0 ? `[${onlyMethod.join(", ")}] the parser does not` : "nothing extra"}, ` +
          `${CODE_FILE}'s ${pair.constant} has ` +
          `${onlyCode.length > 0 ? `[${onlyCode.join(", ")}] the method does not` : "nothing extra"}`,
      );
    }
  }
  return { findings, examined };
}

/** @param {import("../lib/corpus.mjs").Corpus} c @returns {string[]} */
const audit = (c) => auditWithCoverage(c).findings;

/** @type {import("../lib/harness.mjs").ModelFreeEval} */
export default {
  id: "MF-05",
  kind: "model-free",
  title: "the method's card vocabularies and the parser's are one vocabulary",
  contract: `${METHOD_FILE} and ${CODE_FILE} — statuses, sizes and review modes, declared once each`,
  reads: [METHOD_FILE, CODE_FILE],

  async check() {
    const { findings, examined } = auditWithCoverage(readCorpus([CODE_FILE]));
    if (findings.length > 0) {
      return { ok: false, detail: `${findings.length} vocabulary disagreement(s)`, lines: findings };
    }
    return { ok: true, detail: `${examined} vocabularies compared, all agreeing` };
  },

  async degrade() {
    const clean = readCorpus([CODE_FILE]);
    // A NINTH STATUS added to the method text alone — the exact edit
    // CONVENTIONS forbids by name, made the way somebody would make it
    // while trying to be helpful.
    const broken = degraded(clean, METHOD_FILE, (t) =>
      t.replace("# rejected | merging | done | parked", "# rejected | merging | done | parked | closed"),
    );
    return control({
      clean,
      broken,
      audit,
      names: (f) => f.includes("closed"),
      what: "a ninth task status added to the method text alone",
    });
  },
};
