/**
 * MF-10 — the digest comparison is RUN against real verdicts, and the run
 * is INVOKED by the eval gate rather than by a seat remembering.
 *
 * WHAT MF-09 LEFT. MF-09 proves the comparison refuses: five matrix rows,
 * three degraded judges, all of it against fixtures it builds and throws
 * away. `T-205-s1`'s card is one sentence about that: **"So the comparison
 * is proved. Nothing invokes it."** `docs/CONVENTIONS.md`'s bench bullet
 * says the same thing from the other side — *"WHAT IS STILL A HAND STEP IS
 * THE WIRING"*. This eval is the wiring, and the answer to the card's first
 * criterion — *what invokes the check* — is: **this eval, and therefore
 * `node tools/method-evals/run.mjs`, the METHOD EVAL GATE.** A seat that
 * runs the gate it already owes runs this; nobody has to remember it.
 *
 * WHAT IT ACTUALLY MEASURES, in the order the arms run:
 *
 *   1. THE SEAMS ARE NOT LOAD-BEARING. `verdict-digest.mjs` takes a judge
 *      and a collector so this file can degrade them. The production path
 *      must be MF-09's judge and the checker's own collector BY IDENTITY —
 *      `docs/CONVENTIONS.md`'s LIFTING A SAFETY GUARD TO DISCRIMINATE: a
 *      seam that can weaken the real path is a seam somebody must check.
 *
 *   2. MF-09's MATRIX, RUN THROUGH THE CHECKER'S WHOLE WALK. Not a second
 *      matrix — THE matrix, imported, with the checker's card walk,
 *      resolution and judging as its subject (the card's fifth criterion,
 *      `T-057`). **This is the arm that catches what a judge-level proof
 *      cannot**: MF-09's PREFIX row is a line the strict grammar does not
 *      match at all, so a collector keyed on that grammar would never hand
 *      the line to the judge and the row would vanish between them.
 *
 *   3. THE FIVE FIXTURE CARDS, from the tree alone — a verifying citation
 *      (beside prose that QUOTES the grammar, so the line anchor is under
 *      assertion too), a mismatch, a truncated digest, a digest naming no
 *      file, and a card carrying no citation at all, which is exit 3
 *      because an exit 0 over zero bodies is not a pass. These are
 *      committed rather than synthesized so the ACCEPT path is checkable
 *      with no scratchpad and no machine-scoped path anywhere.
 *
 *   3b. A POINTED-AT FILE THAT IS NOT THERE is MISSING and not merely
 *      unreachable — exit 1, not 3. The two are both non-zero, so MF-09's
 *      matrix cannot separate them; collapsing them tells a caller *I could
 *      not tell you* about a file somebody DELETED, and deleting the file
 *      is the bypass again. A mutant survived the whole eval until this arm
 *      existed.
 *
 *   4. THE REAL BOARD. Every `docs/tasks/*.md` at this ref, walked with NO
 *      resolution root. A citation whose file is reachable and does not
 *      match is a finding NAMING THE CARD. A citation that is merely
 *      unreachable is NOT a finding — it is today's documented state and
 *      arm 5 is what keeps that honest.
 *
 *   5. THE WIRING, OVER A REAL VERDICT. One real card whose saved file is
 *      unreachable is run through the checker's own `main`, and the exit
 *      must be `3` and the output must name the file and where the method
 *      expects it. **This is the arm that forbids the tempting fail-open**:
 *      *nothing to compare against, so skip*, which is MF-09's MISSING
 *      lesson one level up.
 *
 * WHY UNREACHABLE IS NOT A FINDING AND EXIT 3 IS NOT A PASS. Every one of
 * the citations on the board today names a bare filename that resolves only
 * inside the dispatching session's scratchpad (`docs/CONVENTIONS.md`'s
 * SCRATCH RULE). `method/lane-protocol.md` rule 4 says a machine-scoped
 * surface is DERIVED from the lane and never defaulted, so a checkout that
 * guessed at that directory would be inventing the default the rule
 * forbids. The checker therefore refuses to guess and exits `3` — the house
 * code for *this run is not a claim* (`lib/exit.mjs`). An eval that RED on
 * that would red forever for a state nobody is doing wrong; an eval that
 * PASSED on it would be certifying a checker that never checked anything.
 * So the eval requires the checker to say `3`, loudly, with the file named
 * — and the day a home in the tree is ruled for sealed sets, the same arms
 * start verifying instead, with no code change here.
 */

import { createHash } from "node:crypto";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { EXIT } from "../lib/exit.mjs";
import { repoRoot, suiteDir } from "../lib/fixture-root.mjs";
import {
  boardCards,
  exitFor,
  INSPECT_DEFAULTS,
  inspect,
  main as checkerMain,
  sites,
  tally,
} from "../verdict-digest.mjs";
import {
  CITATION,
  failOpenJudge,
  judge,
  matrix,
  prefixJudge,
  presenceJudge,
} from "./mf-09-attack-set-digest-refusal.mjs";

/** The committed fixture pair, relative to `tools/method-evals`. */
const FIXTURES = path.join(suiteDir, "fixtures", "verdict-digest");
const SAVED = path.join(FIXTURES, "saved");
const CARD = (/** @type {string} */ name) => path.join(FIXTURES, "cards", name);

/**
 * What each committed fixture card must do. The EXIT is the contract a
 * caller reads; the SUBSTRING is what the reader is told.
 *
 * @type {{ card: string; exit: number; says: string; what: string }[]}
 */
const FIXTURE_EXPECTATIONS = [
  {
    card: "T-901-the-citation-that-must-verify.md",
    exit: EXIT.CLEAN,
    says: "1 citation(s) in 1 card(s) — 1 verified",
    // THE CARD ALSO QUOTES THE GRAMMAR MID-SENTENCE, the way two real
    // cards on the board discuss the rule. So EXACTLY ONE is the
    // assertion: a collector that dropped the line anchor would read the
    // prose as a second, malformed citation and refuse a clean card.
    what: "a citation whose file hashes to its digest, beside prose quoting the grammar",
  },
  {
    card: "T-902-the-citation-that-must-be-refused.md",
    exit: EXIT.FOUND,
    says: "against a file that hashes to",
    what: "a well-formed digest of DIFFERENT real content",
  },
  {
    card: "T-903-the-truncated-digest.md",
    exit: EXIT.FOUND,
    says: "not 64 lowercase hex",
    what: "a correct leading run of the true digest — resemblance, not equality",
  },
  {
    card: "T-904-the-digest-that-names-no-file.md",
    exit: EXIT.FOUND,
    says: "names a digest and no file",
    what: "a digest citing no file, which nobody can ever check",
  },
  {
    card: "T-906-three-citations-and-every-one-is-walked.md",
    exit: EXIT.FOUND,
    // THE COUNT IS THE ASSERTION. A collector that kept only the first
    // site or only the last (a mutant that survived every other arm)
    // exits 1 here too; only the tally says all three were walked.
    says: "3 citation(s) in 1 card(s) — 1 verified, 2 REFUSED",
    what: "three citations on one card — a mismatch, a match, a truncation — every one of them walked",
  },
  {
    card: "T-905-a-card-with-no-citation.md",
    exit: EXIT.CANNOT_RUN,
    says: "exit 0 over zero bodies is not a pass",
    what: "a walk that found nothing, which is a claim about nothing and never a pass",
  },
];

/**
 * Run the checker's `main` with captured output and a NAMED environment.
 *
 * The env is `{}` on purpose: `SUPERTASKR_ATTACK_SET_DIR` in the ambient
 * environment would make this eval's answer depend on the machine running
 * it, which is the same defect the checker refuses to commit itself.
 *
 * @param {string[]} argv
 * @returns {{ code: number; out: string }}
 */
function runChecker(argv) {
  /** @type {string[]} */
  const lines = [];
  const code = checkerMain(argv, {}, (s) => lines.push(s), (s) => lines.push(s));
  return { code, out: lines.join("\n") };
}

/**
 * MF-09's matrix subject, built out of the CHECKER's whole pipeline.
 *
 * The matrix hands a VERDICT TEXT and a FILE; the checker's unit is a CARD
 * on disk. So the text is written to a throwaway card and walked — which is
 * the point: the collector, the resolution and the judge are all in the
 * path, so a row lost anywhere along it is lost visibly.
 *
 * @param {object} [seams]
 * @param {typeof judge} [seams.judge]
 * @param {typeof sites} [seams.collect]
 * @returns {(verdict: string, file: string) => { verdict: string; reason: string }}
 */
function pipeline(seams = {}) {
  return (verdict, file) => {
    void file; // every matrix row cites its file ABSOLUTELY, inside the text.
    const dir = mkdtempSync(path.join(tmpdir(), "supertaskr-mf10-"));
    try {
      const card = path.join(dir, "T-900-one-matrix-row.md");
      writeFileSync(card, `## Verdicts\n\n${verdict}\n`);
      const { citations } = inspect({ cards: [card], roots: [], ...seams });
      const counts = tally(citations);
      if (counts.cited === 0) {
        return { verdict: "REFUSE", reason: "the verdict cites no attack-set digest" };
      }
      return counts.verified === counts.cited
        ? { verdict: "ACCEPT", reason: /** @type {string} */ (citations[0]?.reason) }
        : { verdict: "REFUSE", reason: /** @type {string} */ (citations[0]?.reason) };
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  };
}

/**
 * A DEGRADED COLLECTOR: resemblance accepted at the collector, so a
 * truncated digest reaches the judge instead of being refused before it.
 *
 * @type {typeof sites}
 */
function looseCollector(text) {
  const loose = /^[ \t]*attack set:[ \t]*sha256:([0-9a-f]+)[ \t]*\(([^)]+)\)/i;
  /** @type {ReturnType<typeof sites>} */
  const found = [];
  const lines = text.split("\n");
  for (let i = 0; i < lines.length; i += 1) {
    const raw = /** @type {string} */ (lines[i]);
    const m = loose.exec(raw);
    if (m === null) continue;
    found.push({
      line: i + 1,
      raw: raw.trim(),
      name: /** @type {string} */ (m[2]).trim(),
      wellFormed: true,
    });
  }
  return found;
}

/**
 * A DEGRADED COLLECTOR: MF-09's strict grammar and nothing else — the
 * tempting reuse. A malformed citation stops being a citation, so a verdict
 * cited wrong reads exactly like a verdict that cited nothing.
 *
 * @type {typeof sites}
 */
function strictOnlyCollector(text) {
  /** @type {ReturnType<typeof sites>} */
  const found = [];
  const lines = text.split("\n");
  for (let i = 0; i < lines.length; i += 1) {
    const raw = /** @type {string} */ (lines[i]);
    if (!CITATION.test(raw)) continue;
    const named = /\(([^)]+)\)/.exec(raw);
    found.push({
      line: i + 1,
      raw: raw.trim(),
      name: named === null ? null : /** @type {string} */ (named[1]).trim(),
      wellFormed: named !== null,
    });
  }
  return found;
}

/** @type {import("../lib/harness.mjs").ModelFreeEval} */
export default {
  id: "MF-10",
  kind: "model-free",
  title: "the attack-set digest comparison is run against real verdicts, by the gate",
  contract:
    "method/roles/orchestrator.md 5d + docs/CONVENTIONS.md's bench bullet — a verdict's " +
    "cited digest is CHECKED against the saved file, a mismatch refuses by name, and an " +
    "unreachable saved file is exit 3 and never a pass",
  reads: [
    "method/roles/orchestrator.md",
    "docs/CONVENTIONS.md",
    "docs/tasks/*.md",
    "tools/method-evals/verdict-digest.mjs",
  ],

  async check() {
    /** @type {string[]} */
    const findings = [];

    // 1. THE SEAMS ARE NOT LOAD-BEARING IN PRODUCTION.
    if (INSPECT_DEFAULTS.judge !== judge) {
      findings.push(
        "the checker's default judge is NOT MF-09's judge, so the comparison has been " +
          "written twice and the reuse this card required is gone",
      );
    }
    if (INSPECT_DEFAULTS.collect !== sites) {
      findings.push("the checker's default collector is not its own `sites`");
    }

    // 1b. 3 OUTRANKS 1 — the checker's header claims the ordering, and
    // until this line nothing could fail on it. Synthesized counts, so the
    // arm does not depend on what the live board holds.
    {
      const mixed = exitFor({ cited: 2, verified: 0, refused: 1, unavailable: 1 });
      if (mixed !== EXIT.CANNOT_RUN) {
        findings.push(
          `a tally holding a REFUSED and an UNAVAILABLE row exits ${mixed} instead of ` +
            `${EXIT.CANNOT_RUN} — "I could not tell you" must outrank "I found it"`,
        );
      }
    }

    // 2. MF-09's MATRIX, THROUGH THE CHECKER'S WHOLE WALK.
    for (const w of matrix(pipeline())) {
      findings.push(`the checker's walk loses a row MF-09 holds — ${w}`);
    }

    // 3. THE FOUR COMMITTED FIXTURE CARDS.
    for (const e of FIXTURE_EXPECTATIONS) {
      const { code, out } = runChecker(["--scratch", SAVED, CARD(e.card)]);
      if (code !== e.exit) {
        findings.push(`${e.card} (${e.what}): wanted exit ${e.exit}, got ${code}`);
      } else if (!out.includes(e.says)) {
        findings.push(`${e.card} exits ${code} but never says "${e.says}" — ${out.split("\n")[0]}`);
      }
    }

    // 3b. A POINTED-AT FILE THAT IS NOT THERE IS *MISSING*, NEVER MERELY
    // *UNAVAILABLE* — and this arm exists because a mutant SURVIVED without
    // it (the drill's M6). Collapsing the two is a fail-open wearing a
    // refusal's clothes: it still exits non-zero, so MF-09's matrix — which
    // only asks ACCEPT or REFUSE — cannot see it, while the CALLER is told
    // `3`, *I could not tell you*, about a saved file somebody DELETED.
    // Deleting the file becomes the bypass again, one level above MF-09's
    // MISSING row.
    {
      const dir = mkdtempSync(path.join(tmpdir(), "supertaskr-mf10-gone-"));
      try {
        // Inside a directory we just made, so it provably does not exist,
        // and ABSOLUTE, so resolution points at it rather than giving up.
        const gone = path.join(dir, "attack-set-T-906.md");
        const digest = createHash("sha256")
          .update(readFileSync(path.join(SAVED, "attack-set-T-901.md"), "utf8"), "utf8")
          .digest("hex");
        const card = path.join(dir, "T-906-the-saved-file-is-gone.md");
        writeFileSync(card, `## Verdicts\n\nattack set: sha256:${digest} (${gone})\n`);
        const { code, out } = runChecker([card]);
        if (code !== EXIT.FOUND) {
          findings.push(
            `a citation POINTING AT a file that is not there exited ${code} instead of ` +
              `${EXIT.FOUND} — a deleted saved file is a REFUSAL, never an "I could not reach it"`,
          );
        }
        if (!out.includes("could not be read")) {
          findings.push("the refusal for a deleted saved file does not say the file could not be read");
        }
      } finally {
        rmSync(dir, { recursive: true, force: true });
      }
    }

    // 4. THE REAL BOARD, WITH NO ROOT NAMED.
    const cards = boardCards();
    const { citations } = inspect({ cards, roots: [] });
    const counts = tally(citations);
    if (counts.cited === 0) {
      findings.push(
        `no verdict in the ${cards.length} card(s) under docs/tasks/ cites an attack set at ` +
          "this ref, so this eval measured nothing — an exit 0 over zero bodies is not a pass",
      );
    }
    for (const c of citations.filter((x) => x.outcome === "REFUSED")) {
      findings.push(
        `a verdict on the board is REFUSED — ${path.relative(repoRoot, c.card)}:${c.line}: ${c.reason}`,
      );
    }

    // 5. THE WIRING, OVER A REAL VERDICT.
    const unreachable = citations.find((c) => c.outcome === "UNAVAILABLE");
    if (unreachable === undefined) {
      if (counts.cited > 0 && counts.verified !== counts.cited) {
        findings.push("no board citation is UNAVAILABLE and not all verify — arm 5 measured nothing");
      }
    } else {
      const { code, out } = runChecker([unreachable.card]);
      if (code !== EXIT.CANNOT_RUN) {
        findings.push(
          `${path.relative(repoRoot, unreachable.card)} cites a file this checkout cannot reach, ` +
            `and the checker exited ${code} instead of ${EXIT.CANNOT_RUN} — an unreachable saved ` +
            "file must never be a pass",
        );
      }
      if (!out.includes(/** @type {string} */ (unreachable.name))) {
        findings.push("the refusal does not NAME the file it could not reach");
      }
      if (!out.includes("SCRATCH RULE") || !out.includes("--scratch")) {
        findings.push("the refusal does not say where the method expects the file, or how to name it");
      }
    }

    // 5b. THE BARE NAME WITH NO ROOT, FROM THE TREE ALONE. Arm 5 depends on
    // the live board holding an unreachable citation — today's state, not a
    // fixture's — and the day every board citation verifies, arm 5 measures
    // nothing. This arm depends on no board: the T-901 fixture's bare name
    // with NO root named must be UNAVAILABLE at exit 3, never VERIFIED, and
    // the run must say that no root was named — a built-in root would print
    // "Root tried" instead, and a root the call did not supply is the default
    // rule 4 forbids. Two mutants survived every other arm until this one:
    // an unreachable name labelled VERIFIED at the walk, and a scratchpad
    // path compiled in as a fourth root.
    {
      const { code, out } = runChecker([CARD("T-901-the-citation-that-must-verify.md")]);
      if (code !== EXIT.CANNOT_RUN) {
        findings.push(
          `a bare-name citation with NO root named exited ${code} instead of ${EXIT.CANNOT_RUN} — ` +
            "an unreachable saved file was treated as a claim",
        );
      }
      if (!out.includes("1 unavailable") || out.includes("1 verified")) {
        findings.push("a bare-name citation with no root named was not counted UNAVAILABLE");
      }
      if (!out.includes("No root was named at this call")) {
        findings.push(
          "with no --scratch and an empty env the checker did not say that no root was named — " +
            "a root the call did not supply is a default, and a default is what rule 4 forbids",
        );
      }
    }

    if (findings.length > 0) {
      return { ok: false, detail: `${findings.length} finding(s)`, lines: findings };
    }
    return {
      ok: true,
      detail:
        `${counts.cited} board citation(s) in ${cards.length} card(s): ${counts.verified} verified, ` +
        `${counts.unavailable} unavailable, ${counts.refused} refused; MF-09's 5 rows hold through ` +
        `the walk; ${FIXTURE_EXPECTATIONS.length} fixture cards`,
    };
  },

  async degrade() {
    // BASELINE FIRST. A red under a degradation proves nothing where the
    // undegraded arrangement was already red.
    const baseline = matrix(pipeline());
    if (baseline.length > 0) {
      throw new Error(
        `the UNDEGRADED checker already fails ${baseline.length} matrix row(s), so this control ` +
          `has no baseline. First: ${baseline[0]}`,
      );
    }

    /** @type {{ ok: boolean; line: string }[]} */
    const arms = [];

    // A + B — MF-09's OWN DEGRADED JUDGES, driven through the checker.
    for (const j of [
      { what: "a PRESENCE check in the checker's judge slot", subject: presenceJudge, row: "MISMATCH" },
      { what: "a FAIL-OPEN missing-file branch in the checker's judge slot", subject: failOpenJudge, row: "MISSING" },
    ]) {
      const wrong = matrix(pipeline({ judge: j.subject }));
      const hit = wrong.filter((w) => w.startsWith(j.row));
      arms.push(
        hit.length > 0
          ? { ok: true, line: `${j.what} is caught at ${hit[0]}` }
          : { ok: false, line: `${j.what} was NOT caught — ${wrong.length} row(s) wrong` },
      );
    }

    // C — THE COLLECTOR THAT ACCEPTS A RESEMBLANCE, plus MF-09's prefix
    // judge behind it. The judge alone cannot reach this row: the real
    // collector refuses a truncated digest before any judge is consulted,
    // so degrading the judge on its own leaves the row correct and the
    // control vacuous. This degrades the half that decides it.
    {
      const truncated = CARD("T-903-the-truncated-digest.md");
      const { citations } = inspect({
        cards: [truncated],
        roots: [SAVED],
        collect: looseCollector,
        judge: prefixJudge,
      });
      const counts = tally(citations);
      const slipped = counts.verified > 0;
      arms.push(
        slipped
          ? {
              ok: true,
              line:
                "a LOOSE collector behind MF-09's PREFIX judge lets the truncated citation " +
                `VERIFY (exit ${exitFor(counts)} where ${EXIT.FOUND} is owed) — caught by the ` +
                "T-903 fixture expectation",
            }
          : {
              ok: false,
              line: "the loose collector + prefix judge did NOT let the truncated citation through",
            },
      );
    }

    // D — THE TEMPTING REUSE: MF-09's strict grammar as the collector. The
    // malformed citation stops being a citation at all, so a verdict cited
    // wrong reads as a verdict that cited nothing.
    {
      const truncated = CARD("T-903-the-truncated-digest.md");
      const { citations } = inspect({
        cards: [truncated],
        roots: [SAVED],
        collect: strictOnlyCollector,
      });
      const counts = tally(citations);
      const vanished = counts.cited === 0 && exitFor(counts) !== EXIT.FOUND;
      arms.push(
        vanished
          ? {
              ok: true,
              line:
                "a collector keyed on MF-09's strict grammar alone loses the truncated citation " +
                `entirely (0 cited, exit ${exitFor(counts)} where ${EXIT.FOUND} is owed) — caught ` +
                "by the T-903 fixture expectation",
            }
          : { ok: false, line: "the strict-only collector did NOT lose the truncated citation" },
      );
    }

    // E — THE FAIL-OPEN EXIT POLICY, on synthesized counts so the arm does
    // not depend on what the live board happens to hold.
    {
      const counts = { cited: 1, verified: 0, refused: 0, unavailable: 1 };
      const honest = exitFor(counts);
      const failOpen = exitFor(counts, { unavailableIsClean: true });
      arms.push(
        honest === EXIT.CANNOT_RUN && failOpen === EXIT.CLEAN
          ? {
              ok: true,
              line:
                `an unreachable saved file exits ${honest} under the checker's own policy and ` +
                `${failOpen} under a fail-open one — the two disagree, and the shipped one refuses`,
            }
          : {
              ok: false,
              line: `the fail-open exit policy is indistinguishable: honest ${honest}, fail-open ${failOpen}`,
            },
      );
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
