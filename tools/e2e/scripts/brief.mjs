#!/usr/bin/env node
/**
 * THE BRIEF COMMAND (T-133) — the runnable half of `dispatch-brief.mjs`.
 *
 * THE ONE SPELLING, run from the repo ROOT and by a dispatcher with no
 * lane. It writes nothing; every call it makes is a read.
 *
 *   node tools/e2e/scripts/brief.mjs --task T-133
 *   node tools/e2e/scripts/brief.mjs --state
 *   node tools/e2e/scripts/brief.mjs --task T-133 --state --full
 *   node tools/e2e/scripts/brief.mjs --card T-150
 *
 * ARM ONE (`--task`) emits the row set of `method/roles/<role>.md`'s
 * normative contract table, each row derived from the source that row
 * names. ARM TWO (`--state`) emits the sections of docs/STATE.md a
 * command can answer — the lane list first, because it is the row both
 * consumers got wrong. They are one command because the lane list is the
 * shared row.
 *
 * ARM FOUR (`--card`, T-150) points arm one's machinery ONE SEAT OVER, at
 * the card AUTHOR. It answers the figures an author would otherwise type
 * — board counts, fence weight, fence demand, contention, dependency
 * counts, history lengths — as paste-ready stamped lines, and then it
 * RE-RUNS every provenance the card already claims. A figure the tool
 * cannot re-run is reported rather than accepted, which is the whole
 * difference between this and a lint that checks a marker is present.
 *
 * Execution lives in this wrapper and NOT in the module beside it, so
 * importing the derivation is side-effect-free — the lint-tokens shape,
 * for the reason that file gives: an `import.meta.url === process.argv[1]`
 * guard disagrees with itself under symlinked checkouts and turns a gate
 * into a silent exit 0.
 *
 * EXIT CODES — the house contract, the same four `index --check`,
 * `boot:check` and the DOCS GATE use, so "I derived it" and "I could not
 * tell you" are never the same number:
 *   0  assembled, and nothing is owed.
 *   1  assembled and FOUND something: a contract row with no deriver, a
 *      deriver whose row the table no longer carries, two live fences
 *      that are not disjoint, a lane whose card cannot be read, or the
 *      slug map's two copies disagreeing. Read the message.
 *   2  called wrong: an unknown flag, or neither arm asked for.
 *   3  the command COULD NOT RUN, so this run is not a claim about the
 *      repository at all. Every throw out of the derivation lands here,
 *      and every one of them names the sentence it could not find.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import {
  FINDING_VERDICTS,
  auditCard,
  cardReport,
  derivedTexts,
} from "./card-figures.mjs";
import {
  EXIT,
  assembleBrief,
  context,
  note,
  render,
  stateReport,
  treeProv,
  value,
} from "./dispatch-brief.mjs";
import { dispatchContext, dispatchReport } from "./dispatch-order.mjs";

const FLAGS = Object.freeze([
  "--task",
  "--role",
  "--root",
  "--state",
  "--dispatch",
  "--card",
  "--audit",
  "--full",
  "--help",
]);

/** @param {string[]} argv @returns {Promise<number>} */
async function main(argv) {
  /** @type {Record<string, string>} */
  const opts = {};
  let wantsState = false;
  let wantsDispatch = false;
  let full = false;
  for (let i = 0; i < argv.length; i += 1) {
    const a = /** @type {string} */ (argv[i]);
    if (!a.startsWith("-")) {
      console.error(
        `brief: unexpected argument ${JSON.stringify(a)} — every input is a named flag ` +
          `(${FLAGS.join(" ")}), because a positional this command guessed at is a brief row ` +
          "filled from somewhere other than its source.",
      );
      return EXIT.USAGE;
    }
    if (!FLAGS.includes(a)) {
      console.error(`brief: unknown flag ${a} — usage: ${FLAGS.join(" ")}`);
      return EXIT.USAGE;
    }
    if (a === "--help") {
      console.log(
        "usage: node tools/e2e/scripts/brief.mjs --task <T-NNN> [--role <role>] [--state] " +
          "[--dispatch] [--card <T-NNN>] [--audit <path>] [--full] [--root <path>]",
      );
      return EXIT.CLEAN;
    }
    if (a === "--state") {
      wantsState = true;
      continue;
    }
    if (a === "--dispatch") {
      wantsDispatch = true;
      continue;
    }
    if (a === "--full") {
      full = true;
      continue;
    }
    const v = argv[i + 1];
    if (v === undefined || v.startsWith("-")) {
      console.error(`brief: ${a} needs a value`);
      return EXIT.USAGE;
    }
    opts[a.slice(2)] = v;
    i += 1;
  }
  const taskId = opts["task"] ?? "";
  const cardId = opts["card"] ?? "";
  const auditPath = opts["audit"] ?? "";
  if (taskId === "" && cardId === "" && auditPath === "" && !wantsState && !wantsDispatch) {
    console.error(
      "brief: nothing asked for — give --task <T-NNN> for a dispatch brief, --state for the " +
        "sections of docs/STATE.md a command can answer, --dispatch for what is startable now " +
        "and why the rest are not, --card <T-NNN> for the figures a card author would " +
        "otherwise type, or any combination.\n" +
        "  An empty request is not a clean run; it is a question this command was never asked.",
    );
    return EXIT.USAGE;
  }

  const ctx = context({
    ...(opts["root"] === undefined ? {} : { root: opts["root"] }),
    ...(opts["role"] === undefined ? {} : { role: opts["role"] }),
    taskId,
    full,
  });

  if (taskId !== "") {
    if (ctx.card === undefined) {
      console.error(
        `brief: no live card declares id ${taskId} — the board is read off the tree (flat ` +
          "docs/tasks/T-*.md), so an id with no card is a question about a card that is not there.",
      );
      return EXIT.USAGE;
    }
    const { recs } = assembleBrief(ctx);
    console.log(render(recs));
  }

  if (wantsState) {
    if (taskId !== "") console.log("");
    console.log(render(stateReport(ctx)));
  }

  if (wantsDispatch) {
    if (taskId !== "" || wantsState) console.log("");
    console.log(
      render(
        dispatchReport(
          await dispatchContext(opts["root"] === undefined ? {} : { root: opts["root"] }),
        ),
      ),
    );
  }

  /** @type {string[]} */
  let cardFindings = [];
  /**
   * The context the CARD arms derive against. `--audit` shares it, because
   * a card-scoped deriver compared against an empty set produces a STALE
   * verdict that is a claim about the invocation rather than about the
   * figure — measured here, on this command's own first run.
   */
  let cardCtx = ctx;
  if (cardId !== "") {
    cardCtx =
      cardId === taskId
        ? ctx
        : context({
            ...(opts["root"] === undefined ? {} : { root: opts["root"] }),
            ...(opts["role"] === undefined ? {} : { role: opts["role"] }),
            taskId: cardId,
            full,
          });
    if (cardCtx.card === undefined) {
      console.error(
        `brief: no live card declares id ${cardId} — the board is read off the tree (flat ` +
          "docs/tasks/T-*.md), so an id with no card is a question about a card that is not there.",
      );
      return EXIT.USAGE;
    }
    const cardText = readFileSync(path.join(cardCtx.root, cardCtx.card.file), "utf8");
    const report = cardReport(cardCtx, cardText);
    cardFindings = report.findings;
    if (taskId !== "" || wantsState || wantsDispatch) console.log("");
    console.log(render(report.recs));
  }

  /** @type {string[]} */
  let auditFindings = [];
  if (auditPath !== "") {
    /**
     * THE SAME AUDIT OVER ANY MARKDOWN, AND THE REASON IS ONE OF THE TWO
     * FAILURES T-150 NAMES. `T-141`'s wrong figure was in a CARD, which
     * `--card` reaches; `T-137`'s was in a dispatch BRIEF, which no card
     * gate can reach because a brief is not committed anywhere. A brief
     * is markdown and the audit is text-in, so the dispatcher can point
     * this at the brief it is about to send. It is the same code, the
     * same derivers and the same five verdicts.
     */
    const text = readFileSync(path.resolve(cardCtx.root, auditPath), "utf8");
    const figures = auditCard(text, derivedTexts(cardCtx));
    if (taskId !== "" || wantsState || wantsDispatch || cardId !== "") console.log("");
    console.log(
      render([
        note("THE AUDIT, over a file that is not a card"),
        // The path goes out as a stamped VALUE and not as a note, because a
        // note may not carry a digit and a path routinely does. That rule is
        // dispatch-brief.mjs's and it is doing exactly its job here.
        value(`audited file: ${auditPath}`, treeProv(cardCtx.ref, "the path handed to --audit")),
      ]),
    );
    if (figures.length === 0) {
      console.log(
        render([note("  no figure in it claims a provenance and no census claim is made")]),
      );
    }
    for (const f of figures) {
      console.log(
        render([
          value(
            `${f.verdict} line ${f.line}: ${f.text}`,
            treeProv(cardCtx.ref, `${auditPath}, audited against this checkout's derivers`),
          ),
          note(`  ${f.detail}`),
        ]),
      );
      if (FINDING_VERDICTS.includes(f.verdict)) {
        auditFindings.push(`${f.verdict} at ${auditPath} line ${f.line}: ${f.text}`);
      }
    }
  }

  const findings = [...ctx.findings, ...cardFindings, ...auditFindings];
  if (findings.length > 0) {
    console.error("");
    console.error(`brief: FOUND ${findings.length} thing(s) the assembler could not settle:`);
    for (const f of findings) console.error(`  ${f}`);
    console.error(
      "  Each of these is a row a brief would otherwise fill by guessing, or a figure a card " +
        "states that this repository does not. The repository wins over any brief and over any " +
        "card, including this one.",
    );
    return EXIT.FOUND;
  }
  return EXIT.CLEAN;
}

let code;
try {
  code = await main(process.argv.slice(2));
} catch (err) {
  console.error("brief: COULD NOT RUN");
  console.error(`  ${err instanceof Error ? err.message : String(err)}`);
  console.error(
    "  This run is not a claim about the repository — it is a claim about this command. " +
      "Nothing was written.",
  );
  code = EXIT.CANNOT_RUN;
}
process.exit(code);
