#!/usr/bin/env node
/**
 * THE CHEAP CHECKS A PUSH PAYS FOR UNCONDITIONALLY (T-203).
 *
 * ── THEY ARE NOT PART OF THE TOKEN, AND THAT IS THE POINT ────────────
 * The verdict token answers "were the graded suites green against this
 * exact tree?". These two answer a smaller question the token cannot:
 * "is the board this push carries even COHERENT?". They are separated
 * because they have different costs and different failure modes — the
 * battery takes minutes and is paid once per push against a token, while
 * these take milliseconds and are therefore paid EVERY time, with no
 * token to go stale and no way to satisfy them by having run something
 * earlier.
 *
 * ── EACH ONE IS A MEASURED INSTANCE, NOT A CATEGORY ──────────────────
 * Both fired on this project in one night, both AFTER the commit that
 * created them, and both reached a push:
 *
 *   BLOCKERS — `blocked_by: [T-190]` naming a card that did not exist
 *   reached CI and reddened it in `lib/parser/test/smoke.test.ts`. The
 *   gate that would have named the failing card was never asked, because
 *   the seat had read a clean `docs-gate --census` — whose exit answers
 *   the WHOLE-TREE half and not the diff (that gate's own T-142-s1
 *   paragraph). A card whose wait can never be satisfied is a card no
 *   seat can tell has been unblocked.
 *
 *   PLACEMENT — a card stamped out of `suggested` without its four
 *   required fields. `lib/parser/src/task.ts` makes requiredness
 *   STATUS-AWARE: a suggestion is a minimal file, and every other status
 *   but `parked` requires the full placement set. Moving the status
 *   without the fields is a parser red waiting for whoever next parses
 *   the tree.
 *
 *   RECORDS — `docs/STATE.md` stale against a newly CREATED checkpoint
 *   record, twice (`census exit=1`), each time read after the commit had
 *   landed. COMMITTING A RECORD IS WHAT MAKES STATE STALE, so a gate read
 *   BEFORE that commit cannot see it and a gate read at the PUSH can. An
 *   APPEND to a record already checkpointed with its STATE regeneration
 *   is neither step and is not this finding (T-143-s5).
 *
 * ── WHAT THIS FILE IMPLEMENTS AND WHAT IT ONLY ASKS ──────────────────
 * The record check is `docs-scan.mjs`'s `staleStateRecords` — moved
 * there, not copied, so this file and `docs-gate.mjs` cannot disagree
 * about the tie (T-057). The card checks are computed here over
 * `cardIndex`, which is the SAME board reader the brief, the preflight
 * and the dispatch order use, so nothing here can disagree with them
 * about what a card is or which fields it carries.
 *
 * THE PARSER ITSELF IS NOT RUN, AND THE REASON IS THE DEPENDENCY BUDGET
 * RATHER THAN A PREFERENCE. `lib/parser` is TypeScript needing `npm ci`
 * and a build; a ninety-second-old worktree has neither, and a check that
 * cannot run on a fresh checkout is a check that gets skipped. So these
 * are the parser's rules read off `task.ts` and `validate.ts` and
 * asserted against them by a body — the same mirror `taskCardIssues`
 * already is for frontmatter and status, extended to the two rules that
 * actually reached a push. A rule that moves in the parser reds a body
 * here by name.
 *
 * ── WHOLE BOARD, NOT THE DIFF, AND THE AUTHORITY IS THE DOCS GATE ────
 * The card says "changed cards". This asks the whole live board instead,
 * which is a strict superset, and it does so on `docs-gate.mjs`'s own
 * stated doctrine: *"a card broken three commits ago is still broken"*.
 * It also needs no range — and a second opinion about which two commits
 * a push's range means is precisely what docs/CONVENTIONS.md's RANGE RULE
 * exists to prevent. Reading every card costs milliseconds.
 *
 * ── EXIT CODES — the house four ──────────────────────────────────────
 *   0  ran, and found nothing
 *   1  ran, and FOUND something — the findings are printed, one per line
 *   2  called wrong (an unknown flag, or a --root that is not a directory)
 *   3  the checks COULD NOT RUN, so this run is not a claim about the tree
 *
 * ONLY 1 REFUSES A PUSH. `push-guard.mjs` reads these codes individually
 * for the reason it reads `index --check`'s individually: collapsing 3
 * into 1 would refuse every push made where the checks could not run,
 * which turns an inability into a verdict.
 *
 * ZERO NON-BUILTIN DEPENDENCIES, deliberately — `docs-scan.mjs` and
 * `dispatch-brief.mjs` are both node-builtins-only, so this runs against
 * a bare checkout with no `node_modules` anywhere in it. That is what
 * lets the push guard spawn it from a lane worktree ninety seconds old.
 */

import { existsSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { cardIndex, fieldList, fieldScalar } from "./dispatch-brief.mjs";
import { repoRoot, staleStateRecords } from "./docs-scan.mjs";

export const EXIT = Object.freeze({ CLEAN: 0, FOUND: 1, USAGE: 2, CANNOT_RUN: 3 });

/**
 * The statuses `lib/parser/src/task.ts` calls MINIMAL — the ones that do
 * not require the placement set. Held here and COMPARED against that file
 * by `push-checks.spec.ts`, the treatment every mirrored constant in this
 * repository gets: a rule that moves in the parser reds a body by name
 * instead of leaving this check quietly describing an older parser.
 */
export const MINIMAL_STATUSES = Object.freeze(["suggested", "parked"]);

/**
 * The four placement fields required of every non-minimal card, in
 * `task.ts`'s own order. `id` is NOT one of them: it is required of
 * everything but a `suggested` card, which is a different predicate, and
 * is checked separately below.
 */
export const PLACEMENT_FIELDS = Object.freeze(["feature", "milestone", "priority", "size"]);

/**
 * @typedef {object} Finding
 * @property {string} kind    a stable, greppable name
 * @property {string} file    the card or document at fault
 * @property {string} message the sentence a refused seat reads
 */

/**
 * `blocked_by` entries naming no live card.
 *
 * `validate.ts` check 1: each entry must be the id of a parsed task. A
 * reference into `docs/tasks/rejected/` dangles deliberately — those
 * files are not model inputs (T-016) — and this reports it for the same
 * reason: the wait can never be satisfied either way.
 *
 * @param {Map<string, { id: string, file: string, fields: Record<string, string | string[]> }>} cards
 * @returns {Finding[]}
 */
export function danglingBlockers(cards) {
  /** @type {Finding[]} */
  const found = [];
  for (const card of cards.values()) {
    for (const id of fieldList(card.fields, "blocked_by")) {
      if (cards.has(id)) continue;
      found.push({
        kind: "dangling-blocker",
        file: card.file,
        message:
          `${card.file}: blocked_by names ${id} and no live card declares that id — the wait can ` +
          "never be satisfied and no seat can tell it has been. This is the exact shape that " +
          "reached CI and reddened lib/parser/test/smoke.test.ts.",
      });
    }
  }
  return found;
}

/**
 * Cards whose status has left `suggested` without the fields that status
 * required it to acquire.
 *
 * `task.ts`, verbatim in its own comment: *"suggestions are minimal files
 * (no id/feature/milestone/priority/size required, suggested_by
 * required); parked entries may be backbone-level notes (placement fields
 * optional); every other status requires the full placement set."*
 *
 * A card with NO status at all is not judged here: that is
 * `taskCardIssues`' finding, it is already reported by the docs gate, and
 * two reports of one defect teach a reader that one of them is noise.
 *
 * @param {Map<string, { id: string, file: string, fields: Record<string, string | string[]> }>} cards
 * @returns {Finding[]}
 */
export function placementGaps(cards) {
  /** @type {Finding[]} */
  const found = [];
  for (const card of cards.values()) {
    const status = fieldScalar(card.fields, "status").trim();
    if (status === "") continue;
    if (MINIMAL_STATUSES.includes(status)) continue;
    const missing = PLACEMENT_FIELDS.filter((f) => fieldScalar(card.fields, f).trim() === "");
    if (missing.length === 0) continue;
    found.push({
      kind: "missing-placement",
      file: card.file,
      message:
        `${card.file}: status is ${JSON.stringify(status)}, which is not a minimal status ` +
        `(${MINIMAL_STATUSES.join(", ")}), and the card is missing ${missing.join(", ")} — ` +
        "lib/parser/src/task.ts requires the full placement set of every other status, so this " +
        "card is a parser red the moment anything parses the tree.",
    });
  }
  return found;
}

/**
 * Checkpoint records CREATED after `docs/STATE.md` was last committed.
 *
 * The reading is `staleStateRecords`'s and the reason it is the creating
 * commit rather than the record's latest touch is stated there (T-143-s5);
 * this file re-states nothing, so the two cannot disagree (T-057).
 *
 * @param {string} root
 * @returns {Finding[]}
 */
export function staleState(root) {
  return staleStateRecords(root).map((rec) => ({
    kind: "state-stale",
    file: "docs/STATE.md",
    message:
      `docs/STATE.md is STALE against the newer checkpoint record docs/checkpoints/${rec} — the ` +
      "record was CREATED and STATE was never regenerated beside it (docs-protocol.md rule 4, the " +
      "integrator's step 2). COMMITTING THE RECORD IS WHAT MAKES STATE STALE, which is why this " +
      "is asked at the push and not before the commit. An APPEND to an already-checkpointed " +
      "record is not this finding (T-143-s5).",
  }));
}

/**
 * Every cheap check, over one checkout.
 *
 * @param {string} root
 * @returns {Finding[]}
 */
export function runChecks(root) {
  const cards = cardIndex(root);
  return [...danglingBlockers(cards), ...placementGaps(cards), ...staleState(root)];
}

// ── CLI ──────────────────────────────────────────────────────────────

const USAGE = `push-checks.mjs — the cheap checks a push pays for unconditionally (T-203)

  node tools/e2e/scripts/push-checks.mjs [--root <checkout>]

  --root   the checkout to judge; defaults to this script's own repository

exit: 0 clean · 1 FOUND · 2 called wrong · 3 the checks could not run`;

/** @param {string[]} argv @returns {number} */
export function main(argv) {
  /** @type {string} */
  let root = repoRoot;
  for (let i = 0; i < argv.length; i += 1) {
    const arg = /** @type {string} */ (argv[i]);
    if (arg === "--help" || arg === "-h") {
      process.stdout.write(`${USAGE}\n`);
      return EXIT.CLEAN;
    }
    if (arg === "--root") {
      const value = argv[i + 1];
      if (value === undefined || value === "" || value.startsWith("-")) {
        process.stderr.write(`push-checks: --root needs a directory\n${USAGE}\n`);
        return EXIT.USAGE;
      }
      root = path.resolve(value);
      i += 1;
      continue;
    }
    process.stderr.write(`push-checks: unknown argument ${JSON.stringify(arg)}\n${USAGE}\n`);
    return EXIT.USAGE;
  }
  // CALLED WRONG IS NOT A CLEAN GATE. A --root that is not a directory is
  // a question this tool could not read, and answering it 0 would report
  // "nothing found" about a tree nobody looked at.
  if (!existsSync(root) || !statSync(root).isDirectory()) {
    process.stderr.write(`push-checks: --root ${root} is not a directory\n`);
    return EXIT.USAGE;
  }

  /** @type {Finding[]} */
  let findings;
  try {
    findings = runChecks(root);
  } catch (err) {
    process.stderr.write("push-checks: THE CHECKS COULD NOT RUN\n");
    process.stderr.write(`  ${err instanceof Error ? err.message : String(err)}\n`);
    process.stderr.write(
      "  This run is not a claim about the tree — it is a claim about these checks.\n",
    );
    return EXIT.CANNOT_RUN;
  }
  if (findings.length === 0) {
    process.stdout.write(`push-checks: clean — ${root}\n`);
    return EXIT.CLEAN;
  }
  process.stderr.write(`push-checks: ${findings.length} finding(s) in ${root}:\n`);
  for (const f of findings) process.stderr.write(`  [${f.kind}] ${f.message}\n`);
  return EXIT.FOUND;
}

// `process.exitCode`, NEVER `process.exit()` — brief-flush.spec.ts's
// standing sweep, and it caught this file on its first run. A command
// that ends at `process.exit()` drops whatever stdout has not drained,
// which is invisible to a file and to a TTY and silent through a pipe.
// The push guard reads this script's EXIT CODE and quotes its OUTPUT, so
// a truncated report would be a refusal that could not say why.
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exitCode = main(process.argv.slice(2));
}
