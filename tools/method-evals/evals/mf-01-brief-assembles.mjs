/**
 * MF-01 — a brief assembled at a fixture ref carries every row the
 * contract requires, and a contract row nothing derives is FOUND.
 *
 * This is T-155 §1's third canned task, verbatim: *"a brief assembled at
 * a fixture ref carries every row the contract requires (this one is pure
 * `dispatch-brief.mjs`, no model call)"*.
 *
 * WHAT IS NEW HERE, since the assembler already carries this check.
 * `brief.mjs` reds by itself when the contract table and the deriver set
 * disagree — that is its exit 1. What has never existed is anything that
 * RUNS it when the method text moves. Derive the standing gates from
 * docs/CONVENTIONS.md: GRAPH REGEN fires on code suffixes outside docs/,
 * BOOT GATE on `app/**` and two manifests, the DOCS GATE on paths under
 * `docs/`. A diff confined to `method/**` matches NONE of them. So an
 * `executor.md` rewrite lands today with no gate fired at all, which is
 * ADR-020 decision 2's whole complaint and `T-093-s1`'s class: the hand
 * rules have no mechanical reader. This eval is the reader.
 *
 * THE DEGRADATION IS DERIVED, NEVER TYPED. The mutation appends a row
 * numbered one past the table's own highest, so it survives the table
 * gaining or losing rows; a literal `| 14 |` would go stale the day a
 * fourteenth row is legitimately added, and would then pass while
 * checking nothing.
 */

import { spawnSync } from "node:child_process";
import path from "node:path";
import { materialize, repoRoot } from "../lib/fixture-root.mjs";

const ROLE_FILE = "method/roles/executor.md";
const ASSEMBLER = "tools/e2e/scripts/brief.mjs";
const FIXTURE_CARD = "T-900";

/**
 * Assemble a brief against a root.
 *
 * @param {string} root
 * @returns {{ code: number; text: string }}
 */
function assemble(root) {
  const run = spawnSync(
    process.execPath,
    [path.join(repoRoot, ASSEMBLER), "--task", FIXTURE_CARD, "--root", root],
    { encoding: "utf8", cwd: repoRoot, maxBuffer: 16 * 1024 * 1024 },
  );
  if (run.error !== undefined && run.error !== null) throw run.error;
  return { code: run.status ?? -1, text: `${run.stdout ?? ""}${run.stderr ?? ""}` };
}

/**
 * The contract table's row numbers, read out of the role file.
 *
 * @param {string} text
 * @returns {number[]}
 */
function rowNumbers(text) {
  const rows = [];
  for (const line of text.split("\n")) {
    const m = /^\|\s*(\d+)\s*\|/.exec(line);
    if (m !== null) rows.push(Number(m[1]));
  }
  return rows;
}

/** @type {import("../lib/harness.mjs").ModelFreeEval} */
export default {
  id: "MF-01",
  kind: "model-free",
  title: "a brief assembles at a fixture ref, every contract row derived",
  contract: `${ROLE_FILE} — the normative brief table: every row REQUIRED, each derived from the source its own row names`,
  reads: [ROLE_FILE, ASSEMBLER, "method/lane-protocol.md", "method/tasks/TASK-FORMAT.md"],

  async check() {
    const fixture = materialize("mf01");
    try {
      const rows = rowNumbers(fixture.read(ROLE_FILE));
      if (rows.length === 0) {
        throw new Error(`${ROLE_FILE} carries no numbered contract rows at all`);
      }
      const { code, text } = assemble(fixture.dir);
      if (code !== 0) {
        return {
          ok: false,
          detail:
            `the assembler exited ${code} against the fixture ref — the live method text ` +
            "no longer assembles a whole brief. Read the lines below.",
          lines: text.split("\n").filter((l) => l.trim() !== "").slice(-8),
        };
      }
      const emitted = new Set(
        text
          .split("\n")
          .map((l) => /^ROW (\d+) —/.exec(l))
          .filter((m) => m !== null)
          .map((m) => Number(/** @type {RegExpExecArray} */ (m)[1])),
      );
      const missing = rows.filter((n) => !emitted.has(n));
      if (missing.length > 0) {
        return {
          ok: false,
          detail:
            `the table carries rows ${rows.join(",")} and the brief emitted ` +
            `${[...emitted].join(",")} — missing ${missing.join(",")}. A row the brief ` +
            "omits is a row the session fills in by guessing.",
        };
      }
      return { ok: true, detail: `${rows.length} contract rows, all derived, exit 0` };
    } finally {
      fixture.dispose();
    }
  },

  async degrade() {
    const fixture = materialize("mf01-control");
    try {
      const before = assemble(fixture.dir);
      if (before.code !== 0) {
        throw new Error(
          `the UNDEGRADED fixture ref already exits ${before.code}, so a red under the ` +
            "mutation would prove nothing — this control has no baseline",
        );
      }
      const text = fixture.read(ROLE_FILE);
      const rows = rowNumbers(text);
      const next = Math.max(...rows) + 1;
      const lastRow = text.lastIndexOf(`\n| ${Math.max(...rows)} |`);
      const eol = text.indexOf("\n", lastRow + 1);
      const invented = `| ${next} | **The invented row** — a row no assembler derives | this row | nothing derives it |`;
      fixture.write(ROLE_FILE, `${text.slice(0, eol)}\n${invented}${text.slice(eol)}`);
      // Read the mutation back before running anything: a substitution
      // count is not a mutation (docs/CONVENTIONS.md, POISON DRILL).
      if (!fixture.read(ROLE_FILE).includes(invented)) {
        throw new Error("the mutation did not land in the fixture's role file");
      }

      const after = assemble(fixture.dir);
      const named = after.text.includes(`row ${next}`);
      if (after.code === 1 && named) {
        return {
          ok: true,
          detail: `a contract row nothing derives is FOUND: exit 1 naming row ${next}`,
        };
      }
      return {
        ok: false,
        detail:
          `a contract table gaining row ${next} left the assembler at exit ${after.code}` +
          `${named ? "" : " without naming the row"} — the check does not detect its own degradation`,
        lines: after.text.split("\n").filter((l) => l.trim() !== "").slice(-6),
      };
    } finally {
      fixture.dispose();
    }
  },
};
