/**
 * MF-04 — every path one method file names inside method/ resolves to a
 * file that is there.
 *
 * WHY THIS IS A REAL FAILURE AND NOT A TIDINESS CHECK. The method is a
 * KIT: it is copied whole into somebody else's project, where a dangling
 * pointer is unrecoverable — there is no repository history to search and
 * no author to ask. A rename inside method/ is a two-line commit that
 * leaves seven files pointing at a name that no longer exists, and every
 * one of them still reads like a working reference. The role files
 * point at each other constantly ("per ../lane-protocol.md",
 * "interview/decomposition.md", "tasks/TASK-FORMAT.md") because the brief
 * contract's own design is that no row is the only copy of itself.
 *
 * THE THREE SHAPES DELIBERATELY NOT COUNTED, each because counting it
 * would produce a red that is wrong rather than a red that is news:
 *
 *   1. A path whose first segment is something else — `docs/rooms/
 *      governing-docs.md` is a PROJECT room, not `method/rooms/...`. The
 *      lookbehind is what keeps its tail from being read as a method
 *      reference, and dropping the lookbehind is how this check would
 *      start reporting a file the method never claimed.
 *   2. A PLACEHOLDER — `tasks/T-NNN-slug.md` names a shape, not a file.
 *      method/ is product-agnostic by charter, so placeholders are the
 *      normal way it writes about a project's own files.
 *   3. A project path — `docs/STATE.md`, `docs/CONVENTIONS.md`. Those
 *      exist in THIS repository and must not in a generic one; a method
 *      file naming them is naming the adapter's job.
 */

import { control, degraded, readCorpus } from "../lib/corpus.mjs";

const METHOD_DIRS = "roles|tasks|interview|rooms|runtime|adapters|docs-templates";
const BARE_FILES = new Set(["lane-protocol.md", "docs-protocol.md", "README.md"]);

const REFERENCE = new RegExp(
  String.raw`(?<![\w./-])((?:\.\./)?(?:method/)?(?:(?:${METHOD_DIRS})/)?[\w.-]+\.(?:md|yaml))`,
  "g",
);

/**
 * @param {import("../lib/corpus.mjs").Corpus} corpus
 * @returns {{ findings: string[]; examined: Set<string> }}
 */
function auditWithCoverage(corpus) {
  /** @type {string[]} */
  const findings = [];
  /** @type {Set<string>} */
  const examined = new Set();

  for (const [rel, text] of corpus) {
    if (!rel.startsWith("method/")) continue;
    for (const m of text.matchAll(REFERENCE)) {
      const raw = /** @type {string} */ (m[1]);
      if (raw.includes("NNN")) continue;
      const prefixed = raw.startsWith("../") || raw.startsWith("method/");
      const stripped = raw.replace(/^\.\.\//, "").replace(/^method\//, "");
      const segments = stripped.split("/");
      // A two-segment path under a known method directory is a method
      // reference by its shape. A ONE-segment name is one only when the
      // text says so — an explicit `../` or `method/` prefix, or a name on
      // the short list of files that live at the method root. Without that
      // second clause a RENAMED root file (`../lane-protocols.md`) falls
      // straight through the allowlist and is never examined, which is
      // exactly what this eval's own positive control caught it doing.
      const isMethodShape =
        (segments.length === 2 && new RegExp(`^(?:${METHOD_DIRS})$`).test(/** @type {string} */ (segments[0]))) ||
        (segments.length === 1 && (prefixed || BARE_FILES.has(stripped)));
      if (!isMethodShape) continue;
      examined.add(stripped);
      if (!corpus.has(`method/${stripped}`)) {
        findings.push(`${rel} points at method/${stripped}, which is not in the method tree`);
      }
    }
  }
  return { findings, examined };
}

/** @param {import("../lib/corpus.mjs").Corpus} c @returns {string[]} */
const audit = (c) => auditWithCoverage(c).findings;

/** @type {import("../lib/harness.mjs").ModelFreeEval} */
export default {
  id: "MF-04",
  kind: "model-free",
  title: "every method-internal path reference resolves",
  contract: "method/**/*.md — a file the method names is a file the kit ships",
  reads: ["method/**"],

  async check() {
    const { findings, examined } = auditWithCoverage(readCorpus());
    if (examined.size === 0) {
      throw new Error(
        "not one method-internal reference was examined — the reference shapes have " +
          "changed, or this audit has quietly stopped looking",
      );
    }
    if (findings.length > 0) {
      return {
        ok: false,
        detail: `${findings.length} dangling reference(s) of ${examined.size} distinct targets`,
        lines: findings,
      };
    }
    return { ok: true, detail: `${examined.size} distinct method references, all resolving` };
  },

  async degrade() {
    const clean = readCorpus();
    // A RENAME, which is what actually happens: the pointer keeps its
    // shape and loses its target. Mutating the citing file rather than
    // deleting the cited one keeps the mutation one-sided, so nothing
    // moves on both sides at once (docs/CONVENTIONS.md, POISON DRILL).
    const broken = degraded(clean, "method/roles/integrator.md", (t) =>
      t.replace("../lane-protocol.md", "../lane-protocols.md"),
    );
    return control({
      clean,
      broken,
      audit,
      names: (f) => f.includes("lane-protocols.md"),
      what: "a role file pointing at a renamed lane-protocols.md",
    });
  },
};
