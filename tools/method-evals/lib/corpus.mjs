/**
 * THE METHOD CORPUS — every method file, read once, as a plain map.
 *
 * The pure-text evals take a corpus and return findings. That shape is
 * what makes their POSITIVE CONTROL exact rather than approximate: the
 * degradation is the SAME audit run over a corpus with one entry
 * replaced, so the only difference between the green run and the red one
 * is the mutation itself. No file is written, nothing is restored, and a
 * drill that cannot revert is a drill that cannot lose work.
 *
 * (The one eval that CANNOT work this way is MF-01, because its subject
 * is a program over a repository rather than a function over text — it
 * materializes a fixture ref instead, and says so in its own header.)
 */

import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { repoRoot } from "./fixture-root.mjs";

/** @typedef {Map<string, string>} Corpus  root-relative path -> file text */

/**
 * Read every `.md` under `method/`, plus any extra root-relative files
 * asked for (an eval that compares the method against CODE names the
 * code file here, so its corpus is still one object).
 *
 * @param {string[]} [extra]
 * @returns {Corpus}
 */
export function readCorpus(extra = []) {
  /** @type {Corpus} */
  const corpus = new Map();
  const walk = (/** @type {string} */ dir) => {
    for (const entry of readdirSync(dir).sort()) {
      const abs = path.join(dir, entry);
      if (statSync(abs).isDirectory()) walk(abs);
      else if (entry.endsWith(".md") || entry.endsWith(".yaml")) {
        corpus.set(path.relative(repoRoot, abs), readFileSync(abs, "utf8"));
      }
    }
  };
  walk(path.join(repoRoot, "method"));
  for (const rel of extra) corpus.set(rel, readFileSync(path.join(repoRoot, rel), "utf8"));
  return corpus;
}

/**
 * A corpus with ONE entry replaced — the degradation.
 *
 * It THROWS when the replacement is a no-op, because a mutation that
 * changed nothing is the failure mode the POISON DRILL names by hand: a
 * substitution count is not a mutation, and a control that silently
 * mutated nothing reports a green indistinguishable from a vacuous check.
 *
 * @param {Corpus} corpus
 * @param {string} rel
 * @param {(text: string) => string} mutate
 * @returns {Corpus}
 */
export function degraded(corpus, rel, mutate) {
  const before = corpus.get(rel);
  if (before === undefined) throw new Error(`${rel} is not in the corpus, so it cannot be degraded`);
  const after = mutate(before);
  if (after === before) throw new Error(`the degradation of ${rel} changed nothing`);
  const copy = new Map(corpus);
  copy.set(rel, after);
  return copy;
}

/**
 * The standard shape of a degrade() arm: run the audit twice and require
 * the mutation, and only the mutation, to be what reddens it.
 *
 * @param {object} spec
 * @param {Corpus} spec.clean
 * @param {Corpus} spec.broken
 * @param {(c: Corpus) => string[]} spec.audit  findings; empty is clean
 * @param {(finding: string) => boolean} spec.names  does a finding name the mutation?
 * @param {string} spec.what  the degradation, in words
 * @returns {import("./harness.mjs").EvalResult}
 */
export function control({ clean, broken, audit, names, what }) {
  const baseline = audit(clean);
  if (baseline.length > 0) {
    throw new Error(
      `the UNDEGRADED corpus already reports ${baseline.length} finding(s), so a red under ` +
        `the mutation would prove nothing — this control has no baseline. First: ${baseline[0]}`,
    );
  }
  const found = audit(broken);
  const hit = found.filter(names);
  if (hit.length === 0) {
    return {
      ok: false,
      detail: `${what} was NOT detected — ${found.length} finding(s), none naming it`,
      lines: found.slice(0, 4),
    };
  }
  return { ok: true, detail: `${what} is detected: ${hit.length} finding(s) name it` };
}
