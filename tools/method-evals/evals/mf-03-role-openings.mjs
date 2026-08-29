/**
 * MF-03 — every role file still opens with the two things a brief reads
 * off it: `# Role: <name>` matching the filename, and a one-line summary.
 *
 * WHY THOSE TWO LINES AND NOT THE WHOLE FILE. The brief's contract table
 * says of row 1: *"`roles/<role>.md` (its opening line IS that one-line
 * summary)"*, and of a missing row 1: *"a brief with no role is a chat
 * message"*. So the first two non-empty lines of a role file are load-
 * bearing STRUCTURE, not prose — and a rewrite that opens with a
 * paragraph, or a heading spelled `# The executor role`, silently turns
 * every brief assembled from it into one whose first row is garbage.
 *
 * THE ASSEMBLER READS ONE ROLE PER RUN AND THIS READS ALL FIVE. That is
 * the whole delta over `brief.mjs`, and it is not a small one: four of
 * the five role files have never been read by any program at any point.
 * `app/src-tauri/src/agent/kit.rs` byte-pins `roles/planner.md` into the
 * genesis kit — DERIVE that list at your own ref rather than trusting
 * this sentence — and the executor, verifier, integrator and orchestrator
 * files are outside it. `T-093-s1`'s class exactly: the hand rules have
 * no mechanical reader.
 *
 * THE NAME MATCH IS THE HALF WORTH HAVING. A heading that says
 * `# Role: verifier` at the top of `integrator.md` is the failure that
 * survives every reading and every review — it looks right in both files.
 */

import path from "node:path";
import { control, degraded, readCorpus } from "../lib/corpus.mjs";

/**
 * @param {import("../lib/corpus.mjs").Corpus} corpus
 * @returns {{ findings: string[]; examined: string[] }}
 */
function auditWithCoverage(corpus) {
  /** @type {string[]} */
  const findings = [];
  /** @type {string[]} */
  const examined = [];

  for (const [rel, text] of corpus) {
    if (!rel.startsWith("method/roles/") || !rel.endsWith(".md")) continue;
    examined.push(rel);
    const stem = path.basename(rel, ".md");
    const lines = text.split("\n");
    const firstIndex = lines.findIndex((l) => l.trim() !== "");
    const first = (lines[firstIndex] ?? "").trim();

    const heading = /^#\s+Role:\s+(\S+)\s*$/.exec(first);
    if (heading === null) {
      findings.push(
        `${rel} opens with ${JSON.stringify(first.slice(0, 48))} — a role file's first ` +
          "non-empty line is `# Role: <name>`, which is what row 1 of the brief reads",
      );
      continue;
    }
    if (heading[1] !== stem) {
      findings.push(
        `${rel} is headed "# Role: ${heading[1]}" — the heading and the filename name ` +
          `different roles, and a brief assembled from it would say ${heading[1]}`,
      );
    }

    const summary = (lines.slice(firstIndex + 1).find((l) => l.trim() !== "") ?? "").trim();
    if (summary === "" || /^[#|>\-*]|^\d+\./.test(summary)) {
      findings.push(
        `${rel} has no one-line summary after its heading — the next non-empty line is ` +
          `${JSON.stringify(summary.slice(0, 48))}, and row 1 transcribes that line verbatim`,
      );
    }
  }
  return { findings, examined };
}

/** @param {import("../lib/corpus.mjs").Corpus} c @returns {string[]} */
const audit = (c) => auditWithCoverage(c).findings;

/** @type {import("../lib/harness.mjs").ModelFreeEval} */
export default {
  id: "MF-03",
  kind: "model-free",
  title: "every role file opens with the heading and summary a brief reads",
  contract: "method/roles/*.md — `# Role: <name>` matching the filename, then a one-line summary",
  reads: ["method/roles/*.md"],

  async check() {
    const { findings, examined } = auditWithCoverage(readCorpus());
    if (examined.length === 0) {
      throw new Error("method/roles/ holds no role files — this audit examined nothing");
    }
    if (findings.length > 0) {
      return { ok: false, detail: `${findings.length} role opening(s) broken`, lines: findings };
    }
    return { ok: true, detail: `${examined.length} role files, heading and summary intact` };
  },

  async degrade() {
    const clean = readCorpus();
    // The mutation is the plausible one: a heading reworded into prose
    // style. It is not a deletion, and it is not obviously wrong to read.
    const broken = degraded(clean, "method/roles/executor.md", (t) =>
      t.replace(/^# Role: executor$/m, "# The executor role"),
    );
    return control({
      clean,
      broken,
      audit,
      names: (f) => f.includes("method/roles/executor.md") && f.includes("first"),
      what: "rewording the executor's `# Role:` heading",
    });
  },
};
