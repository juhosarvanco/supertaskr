---
id: T-279-s3
title: "The five SHALLs T-279 lands in method text are pinned by nothing — six data mutants (the order deleted, the order REVERSED, the exemption widened, the fix-pass clause struck, the reason struck, the report row struck) all leave the method eval gate green, and MF-11 below kills every one"
feature: F-04
milestone: 4
size: S
priority: 3
status: suggested
suggested_by: "verifier claude-opus-5@subagent (phase 2) @T-279, 2026-09-09, drilled at 7b9f2ee against the base c768f2f"
blocked_by: []
touches: [tools/method-evals/evals]
builder:
verifier:
built_by:
verified_by:
review:
---

## What was measured

T-279 landed five SHALLs into `method/roles/executor.md` and
`method/lane-protocol.md`. The bench drilled eight one-side data mutants
against them — the property lives in prose, so a data mutant is the only
kind that can grade it (`method/roles/verifier.md` 2b, T-221) — in a
`git clone --shared` of the bench, each mutation read back from
`git diff --numstat` and each restore proved by sha256 against the
pristine `1721c90042fc7fb96fc9ca008cd6dc91b1d8da928d050162ba60e177f8be59df`.

CONTROL, unmutated tip: `node tools/method-evals/run.mjs` exit 0,
`..........  10 model-free eval(s)`.

| # | mutation | gate |
|---|---|---|
| M1 | the order sentence deleted | exit 0, 10 evals |
| M2 | the order REVERSED — suites before the notes | exit 0, 10 evals |
| M3 | the exemption widened to "A last commit re-runs no suite" | exit 0, 10 evals |
| M4 | the fix-pass re-run sentence deleted | exit 0, 10 evals |
| M5 | the reason clause deleted | exit 0, 10 evals |
| M8 | the suite/ref/count row deleted from the report spec | exit 0, 10 evals |

**M2 IS THE ONE THAT MATTERS AND IT IS SILENT BY CONSTRUCTION.** With the
order reversed, a lane runs its suites ONCE and reports "once" — at a
commit carrying neither its implementation notes nor its suggested cards.
The tree that ships was never graded, and no report discloses it, because
the report is true. That is the exact failure T-279 exists to prevent,
and after T-279 nothing detects it.

M3 is the second: an exemption widened from *"moves nothing but your
card's own `status:` line to `verifying`"* to *"a last commit"* is one
edit, reads better than the rule it replaces, and lets a one-line source
fix ride into a commit nothing grades.

## Acceptance criteria

- WHEN `node tools/method-evals/run.mjs` runs against method text whose
  four-move order has been deleted, reversed, or copied into a second
  file THE gate SHALL exit 1 and name which property is missing.
- WHEN a sentence excuses a commit from its suites without naming the
  `status:` line it moves to `verifying` THE gate SHALL exit 1.
- WHEN the failure-safe, the fix-pass clause, the reason clause or the
  report's suite/ref/count row is struck from the method text THE gate
  SHALL exit 1 naming that one.
- WHEN `node tools/method-evals/run.mjs --selftest` runs THE new eval
  SHALL degrade a COPY of the corpus and require its own detection, in
  the shape MF-08 already uses.
- WHEN the eval runs against an unmutated tree THE gate SHALL stay green
  and REPORT its coverage counts, so a predicate that has quietly stopped
  matching shows as a zero rather than as a pass.

## The eval, written and demonstrated at the bench — lift it as is

Placed at `tools/method-evals/evals/mf-11-lane-run-order.mjs`. It needs
nothing else: the harness discovers `evals/*.mjs` by filename and the
corpus reader is already the shape every other model-free eval uses.

**THE DEMONSTRATION THE PROPOSER OWES** (`method/roles/verifier.md` step
0: a control you propose is yours to check). Run three ways at the bench,
detached at `7b9f2ee`:

- against the UNMUTATED tip: exit 0,
  `...........  11 model-free eval(s)`, MF-11 reporting
  *"stated once in method/roles/executor.md; 1 bounded exemption sentence(s)"*.
- `--selftest`: exit 0, `MF-11  4 degradations, all detected`.
- against an implementation LACKING the property — each of M1, M2, M3,
  M4, M5 and M8 above: exit 1, `..........F  11 model-free eval(s)`,
  MF-11 naming the missing property each time. It stays GREEN on the two
  grammar mutants (T-279-s4), which are not its subject.

```js
/**
 * MF-11 — the ONE graded run is stated once, in order, with its reason,
 * its single exemption and its failure-safe, and the report asks for the
 * ref and the count of every graded suite.
 *
 * WHY THIS IS A REAL FAILURE AND NOT A TIDINESS CHECK. `T-279` landed
 * five SHALLs into method text and nothing pinned any of them: the
 * verifier drilled six data mutants against the method eval gate — the
 * order deleted, the order REVERSED, the exemption widened to "a last
 * commit", the fix-pass clause struck, the reason struck, the report row
 * struck — and the gate answered `.......... 10 model-free eval(s)`,
 * exit 0, to every one. The most dangerous of those is silent by
 * construction: with the order reversed, a lane runs its one suite at a
 * commit that carries neither its notes nor its cards, reports "once",
 * and grades a tree nobody ships.
 *
 * WHAT EACH HALF BUYS.
 *  - ORDER, STATED ONCE: the four moves in one sentence in exactly one
 *    method file, with `lane-protocol.md` citing that file rather than
 *    keeping a second copy (`T-057`, and MF-08's shape).
 *  - ORDER, IN THE RIGHT SEQUENCE: notes before suites before stamp,
 *    read as POSITIONS inside that sentence rather than as a phrase, so
 *    a reworded order still grades and a reversed one reds.
 *  - THE REASON BESIDE IT: `T-279`'s own criterion, and the thing that
 *    stops the next seat re-litigating an exemption whose grader is not
 *    named.
 *  - THE EXEMPTION, BOUNDED: every sentence that excuses a commit from a
 *    run must name the `status:` line and `verifying`. This is the arm
 *    that matters most — a widening is one word of editing and reads
 *    better than the rule it replaces.
 *  - THE FAILURE-SAFE, AND ITS DIRECTION: an ambiguous last commit RUNS.
 *  - THE FIX PASS: a new tree owes its own run.
 *  - THE REPORT: a graded suite carries its ref and its count, or "once"
 *    is unfalsifiable afterwards.
 *
 * THE SHAPE THIS DELIBERATELY CANNOT SEE: a paraphrase. Every predicate
 * is two independent tokens inside one sentence, so text rewritten in
 * different words is not counted — the failure it CAN always catch is
 * the ordinary one, a sentence struck or a scope widened by editing.
 * Counts are REPORTED on every pass so a predicate that has quietly
 * stopped matching shows up as a zero rather than as a green.
 */

import { readCorpus } from "../lib/corpus.mjs";

const POINTER_FILE = "method/lane-protocol.md";

/** Flatten to one line so a hard-wrapped sentence is one string. */
const flat = (/** @type {string} */ t) => t.replace(/\s+/g, " ");

/** @param {string} text @returns {string[]} */
const sentences = (text) => flat(text).split(/(?<=[.:])\s+/);

/**
 * Every method file that STATES the four-move order: one sentence
 * carrying "then the suites" and "then the stamp".
 *
 * @param {import("../lib/corpus.mjs").Corpus} corpus
 * @returns {{ rel: string; sentence: string }[]}
 */
function orderStatements(corpus) {
  /** @type {{ rel: string; sentence: string }[]} */
  const out = [];
  for (const [rel, text] of corpus) {
    if (!rel.startsWith("method/") || !rel.endsWith(".md")) continue;
    for (const s of sentences(text)) {
      if (/then the suites/i.test(s) && /then the stamp/i.test(s)) {
        out.push({ rel, sentence: s });
        break;
      }
    }
  }
  return out;
}

/**
 * @param {import("../lib/corpus.mjs").Corpus} corpus
 * @returns {{ findings: string[]; home: string; counts: Record<string, number> }}
 */
function auditWithCoverage(corpus) {
  /** @type {string[]} */
  const findings = [];
  const homes = orderStatements(corpus);
  /** @type {Record<string, number>} */
  const counts = { orderStatements: homes.length, exemptions: 0 };

  if (homes.length === 0) {
    findings.push(
      "no method file states the order of a lane's last moves — code, the notes and the " +
        "cards, the suites, the stamp — so the one graded run has no fixed place and a lane " +
        "that runs at its code commit grades a tree it does not ship (T-279)",
    );
    return { findings, home: "", counts };
  }
  if (homes.length > 1) {
    findings.push(
      `the order is stated in ${homes.length} files (${homes.map((h) => h.rel).join(", ")}) — ` +
        "T-057: a rule with two statements is two chances to disagree, and T-279's criterion " +
        "is that it is stated ONCE",
    );
  }
  const home = /** @type {{ rel: string; sentence: string }} */ (homes[0]);
  const s = home.sentence;

  // THE SEQUENCE, READ AS POSITIONS. A reworded order still grades; a
  // reversed one reds. This is the arm no report can disclose: a lane
  // obeying a reversed order runs ONCE and says so.
  const at = (/** @type {RegExp} */ re) => s.search(re);
  const notes = at(/notes/i);
  const suites = at(/then the suites/i);
  const stamp = at(/then the stamp/i);
  if (!(notes >= 0 && notes < suites && suites < stamp)) {
    findings.push(
      `${home.rel} states the order as "${s.trim()}" — the notes and the cards must come ` +
        "BEFORE the suites and the stamp LAST, or the one graded run grades a tree without " +
        "the lane's own notes and suggested cards in it (T-279 AC1)",
    );
  }

  const homeText = corpus.get(home.rel) ?? "";
  const homeFlat = flat(homeText);
  const homeSentences = sentences(homeText);

  // THE REASON, BESIDE THE RULE rather than in a record: the card is not
  // a document a seat reads at work.
  const reasonAt = homeFlat.search(/graded once/i);
  const orderAt = homeFlat.indexOf(s.slice(0, 40));
  if (reasonAt === -1) {
    findings.push(
      `${home.rel} states the order and never says WHY — "one tree, graded once by the lane ` +
        'and once by the bench" is what stops the next seat restoring the second run (T-279 AC4)',
    );
  } else if (orderAt >= 0 && Math.abs(reasonAt - orderAt) > 900) {
    findings.push(
      `${home.rel} states the reason ${Math.abs(reasonAt - orderAt)} characters from the order ` +
        "it explains — T-279 AC4 asks for it BESIDE the rule",
    );
  }

  // THE EXEMPTION, BOUNDED. Every sentence excusing a commit from a run
  // must name the status line AND the value it moves to.
  for (const [rel, text] of corpus) {
    if (!rel.startsWith("method/") || !rel.endsWith(".md")) continue;
    for (const sent of sentences(text)) {
      if (!/re-runs? no suite|SHALL NOT re-run|runs? no suite/i.test(sent)) continue;
      counts.exemptions += 1;
      if (!/`?status:`?/i.test(sent) || !/verifying/i.test(sent)) {
        findings.push(
          `${rel} excuses a commit from its suites without naming the \`status:\` line it moves ` +
            `to \`verifying\`: "${sent.trim()}" — an exemption that reaches past the stamp lets a ` +
            "source fix ride into a commit nothing grades (T-279 AC2)",
        );
      }
    }
  }
  if (counts.exemptions === 0) {
    findings.push(
      "no method file states the stamp commit's exemption at all, so a lane re-runs a whole " +
        "battery for one status line — or skips it with nothing written down (T-279 AC2)",
    );
  }

  // THE FAILURE-SAFE, AND ITS DIRECTION.
  const failsafe = homeSentences.some(
    (sent) => /cannot tell/i.test(sent) && /run them again|run the suites again/i.test(sent),
  );
  if (!failsafe) {
    findings.push(
      `${home.rel} does not say what a lane does when it cannot tell whether its last commit ` +
        "moved more than the status line — the default has to be RUN, or the exemption is " +
        "decided by judgement and widens with no diff at all (T-279 AC5)",
    );
  }

  // THE FIX PASS — a new tree owes its own run.
  const fixPass = homeSentences.some(
    (sent) => /fix pass/i.test(sent) && /owes its own run|re-run|run at the fix/i.test(sent),
  );
  if (!fixPass) {
    findings.push(
      `${home.rel} does not say that a fix pass after a verdict owes its own run — "once" read ` +
        "per LANE instead of per PASS lands a fix that nothing graded (T-279 AC3)",
    );
  }

  // THE REPORT — a graded suite carries its ref and its count.
  const reportRow = homeSentences.some(
    (sent) =>
      /suite/i.test(sent) && /\bref\b/i.test(sent) && /\bcount\b/i.test(sent) && /report|exit/i.test(sent),
  );
  if (!reportRow) {
    findings.push(
      `${home.rel}'s report spec does not ask each graded suite for the ref it ran at and the ` +
        'count beside its exit — "the suites ran once" is then indistinguishable from "the ' +
        'suites barely ran" (T-279 AC1)',
    );
  }

  // THE POINTER: the file that governs where a lane may run keeps no
  // second copy, and cites the home instead.
  const pointer = corpus.get(POINTER_FILE);
  if (pointer === undefined) {
    findings.push(`${POINTER_FILE} is not in the method tree, so nothing points at the order`);
  } else if (home.rel !== POINTER_FILE) {
    const cite = home.rel.replace(/^method\//, "");
    if (!flat(pointer).includes(cite)) {
      findings.push(
        `${POINTER_FILE} never names ${cite}, so the one place the order is stated is a place ` +
          "the protocol governing a lane's runs does not send its reader",
      );
    }
  }

  return { findings, home: home.rel, counts };
}

/** @param {import("../lib/corpus.mjs").Corpus} c @returns {string[]} */
const audit = (c) => auditWithCoverage(c).findings;

/**
 * One degradation, run against the SAME audit over a corpus with one
 * entry replaced. The baseline is asserted clean first: a red under a
 * mutation proves nothing where the undegraded corpus was already red.
 *
 * @param {import("../lib/corpus.mjs").Corpus} clean
 * @param {string} rel
 * @param {(t: string) => string} mutate
 * @param {(f: string) => boolean} names
 * @param {string} what
 * @returns {{ ok: boolean; line: string }}
 */
function arm(clean, rel, mutate, names, what) {
  const before = clean.get(rel);
  if (before === undefined) return { ok: false, line: `${what}: ${rel} is not in the corpus` };
  const after = mutate(before);
  if (after === before) return { ok: false, line: `${what}: the degradation changed nothing` };
  const broken = new Map(clean);
  broken.set(rel, after);
  const found = audit(broken).filter(names);
  return found.length > 0
    ? { ok: true, line: `${what} is detected: ${found[0]}` }
    : { ok: false, line: `${what} was NOT detected` };
}

/** @type {import("../lib/harness.mjs").ModelFreeEval} */
export default {
  id: "MF-11",
  kind: "model-free",
  title: "the one graded run: stated once, in order, bounded, and reportable",
  contract:
    "method/** — T-279's order (code, notes and cards, suites, stamp) is stated in exactly one " +
    "file with its reason beside it, the stamp exemption names the `status:` line it moves to " +
    "`verifying`, the failure-safe runs, a fix pass owes its own run, and the report asks each " +
    "graded suite for its ref and its count",
  reads: ["method/**/*.md"],

  async check() {
    const { findings, home, counts } = auditWithCoverage(readCorpus());
    if (findings.length > 0) {
      return {
        ok: false,
        detail: `${findings.length} finding(s) against the one-graded-run rule`,
        lines: findings,
      };
    }
    return {
      ok: true,
      detail: `stated once in ${home}; ${counts.exemptions} bounded exemption sentence(s)`,
    };
  },

  async degrade() {
    const clean = readCorpus();
    const baseline = audit(clean);
    if (baseline.length > 0) {
      throw new Error(
        `the UNDEGRADED corpus already reports ${baseline.length} finding(s), so this control ` +
          `has no baseline. First: ${baseline[0]}`,
      );
    }
    const home = /** @type {string} */ (auditWithCoverage(clean).home);

    // ARM ONE — THE ORDER REVERSED. The suites move ahead of the notes;
    // the lane still runs ONCE and still reports "once", and the tree it
    // graded is not the tree it ships. Nothing in a report discloses it.
    const reversed = arm(
      clean,
      home,
      (t) =>
        t
          .split("then the notes and the suggested cards, then the suites your\nfence owes")
          .join("then the suites your fence owes, then the notes and the\nsuggested cards"),
      (f) => f.includes("must come BEFORE the suites"),
      "the order REVERSED — suites before the notes and the cards",
    );

    // ARM TWO — THE EXEMPTION WIDENED, which is one edit and reads
    // better than the rule it replaces: "a last commit" swallows a
    // source fix riding in beside the stamp.
    const widened = arm(
      clean,
      home,
      (t) =>
        t
          .split("A last\ncommit that moves nothing but your card's own `status:` line to\n`verifying` re-runs no suite:")
          .join("A last\ncommit re-runs no suite:"),
      (f) => f.includes("without naming the `status:` line"),
      "the exemption WIDENED from the status line to any last commit",
    );

    // ARM THREE — THE REPORT ROW STRUCK, which is what makes "once"
    // unfalsifiable: an exit with no count and no ref.
    const rowless = arm(
      clean,
      home,
      (t) => t.split(/ \*\*AND EVERY GRADED SUITE BY NAME[\s\S]*?over nothing\./).join(""),
      (f) => f.includes("does not ask each graded suite"),
      "the suite/ref/count row struck from the report spec",
    );

    // ARM FOUR — THE ORDER COPIED into the protocol that should only
    // point at it: two normative copies, drifting from the next edit.
    const copied = arm(
      clean,
      POINTER_FILE,
      (t) =>
        `${t}\n**Code, then the notes and the suggested cards, then the suites your\nfence owes, then the stamp.**\n`,
      (f) => f.includes("the order is stated in 2 files"),
      "the order COPIED into lane-protocol.md",
    );

    const arms = [reversed, widened, rowless, copied];
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
```

## Implementation notes
<!-- executor appends before finishing -->

## Verdicts
