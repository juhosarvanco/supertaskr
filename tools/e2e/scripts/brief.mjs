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
 *
 * ARM ONE (`--task`) emits the row set of `method/roles/<role>.md`'s
 * normative contract table, each row derived from the source that row
 * names. ARM TWO (`--state`) emits the sections of docs/STATE.md a
 * command can answer — the lane list first, because it is the row both
 * consumers got wrong. They are one command because the lane list is the
 * shared row.
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
import { EXIT, assembleBrief, context, render, stateReport } from "./dispatch-brief.mjs";
import { dispatchContext, dispatchReport } from "./dispatch-order.mjs";

const FLAGS = Object.freeze([
  "--task",
  "--role",
  "--root",
  "--state",
  "--dispatch",
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
          "[--dispatch] [--full] [--root <path>]",
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
  if (taskId === "" && !wantsState && !wantsDispatch) {
    console.error(
      "brief: nothing asked for — give --task <T-NNN> for a dispatch brief, --state for the " +
        "sections of docs/STATE.md a command can answer, --dispatch for what is startable now " +
        "and why the rest are not, or any combination.\n" +
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

  if (ctx.findings.length > 0) {
    console.error("");
    console.error(`brief: FOUND ${ctx.findings.length} thing(s) the assembler could not settle:`);
    for (const f of ctx.findings) console.error(`  ${f}`);
    console.error(
      "  Each of these is a row a brief would otherwise fill by guessing. The repository wins " +
        "over any brief, including this one.",
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
