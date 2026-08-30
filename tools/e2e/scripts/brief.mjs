#!/usr/bin/env node
/**
 * THE BRIEF COMMAND (T-133) — the runnable half of `dispatch-brief.mjs`.
 *
 * THE ONE SPELLING, run from the repo ROOT and by a dispatcher with no
 * lane. Every arm but one is a read, and the one that writes writes
 * SOMEWHERE ELSE — into the lane worktree it is handed, never into the
 * checkout it runs in.
 *
 *   node tools/e2e/scripts/brief.mjs --task T-133
 *   node tools/e2e/scripts/brief.mjs --state
 *   node tools/e2e/scripts/brief.mjs --task T-133 --state --full
 *   node tools/e2e/scripts/brief.mjs --card T-150
 *   node tools/e2e/scripts/brief.mjs --task T-160 --preflight
 *   node tools/e2e/scripts/brief.mjs --task T-154 --write-fence ../nputer-T-154
 *
 * ARM ONE (`--task`) emits the row set of `method/roles/<role>.md`'s
 * normative contract table, each row derived from the source that row
 * names. ARM TWO (`--state`) emits the sections of docs/STATE.md a
 * command can answer — the lane list first, because it is the row both
 * consumers got wrong. They are one command because the lane list is the
 * shared row.
 *
 * ARM FIVE (`--write-fence`, T-154) is the ONE arm that writes, and the
 * DISPATCH STEP the whole T-154 mechanism rests on. It expands the card's
 * `touches:` through the parser's one fence implementation and leaves
 * `.nputer/lane-fence.json` in the LANE WORKTREE, so the PreToolUse hook
 * in `.claude/` can enforce the fence at the moment of the write with no
 * `node_modules` and no built parser — which a worktree cut ninety
 * seconds ago has neither of. It is a NAMED arm and requires `--task`, so
 * the read arms above are still exactly reads and the body pinning that
 * (`"THE COMMAND IS A READ"`) drives the same invocation it always did.
 *
 * ARM SIX (`--preflight`, T-160) is the step BETWEEN the brief and the
 * fence: it re-derives, at HEAD, every claim the card makes that IS
 * derivable — the paths it names, the fence it declares, the figures it
 * stamps, the blockers it waits on, the refs it cites — and refuses the
 * dispatch when one no longer holds. It reads and prints; it writes
 * nothing, so it runs before a seat is paid for rather than after. It
 * judges no DESIRABILITY: its own output names the claim classes it
 * checked and the ones it cannot.
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
 *      that are not disjoint, a lane whose card cannot be read, the
 *      slug map's two copies disagreeing, a fence `--write-fence`
 *      could not expand and therefore did not write, or a claim
 *      `--preflight` re-derived that the tree no longer agrees with.
 *      Read the message.
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
import { preflight } from "./card-preflight.mjs";
import {
  EXIT,
  assembleBrief,
  blank,
  context,
  liveProv,
  note,
  render,
  stateReport,
  treeProv,
  value,
} from "./dispatch-brief.mjs";
import { dispatchContext, dispatchReport } from "./dispatch-order.mjs";
import { LaneFenceFinding, buildLaneFence, writeLaneFence } from "./lane-fence.mjs";

const FLAGS = Object.freeze([
  "--task",
  "--role",
  "--root",
  "--state",
  "--dispatch",
  "--card",
  "--audit",
  "--preflight",
  "--write-fence",
  "--full",
  "--help",
]);

/** @param {string[]} argv @returns {Promise<number>} */
async function main(argv) {
  /** @type {Record<string, string>} */
  const opts = {};
  let wantsState = false;
  let wantsDispatch = false;
  let wantsPreflight = false;
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
          "[--dispatch] [--card <T-NNN>] [--audit <path>] [--preflight] " +
          "[--write-fence <worktree>] [--full] [--root <path>]",
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
    if (a === "--preflight") {
      wantsPreflight = true;
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
  const fenceWorktree = opts["write-fence"] ?? "";
  if (wantsPreflight && taskId === "") {
    console.error(
      "brief: --preflight needs --task <T-NNN> — a preflight re-derives ONE card's claims against " +
        "this tree, and which card that is comes from the card, never from the invocation.",
    );
    return EXIT.USAGE;
  }
  if (fenceWorktree !== "" && taskId === "") {
    console.error(
      "brief: --write-fence needs --task <T-NNN> — the manifest is one card's expanded fence, and " +
        "which card it is comes from the card, never from the worktree's directory name.",
    );
    return EXIT.USAGE;
  }
  if (
    taskId === "" &&
    cardId === "" &&
    auditPath === "" &&
    !wantsState &&
    !wantsDispatch &&
    !wantsPreflight
  ) {
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

  /**
   * ARM SIX — the preflight. It runs BEFORE arm five and that ordering is
   * the ritual: a card whose claims no longer hold should not have a
   * manifest written for it, because the manifest is the step that makes
   * the lane real. Its findings join the rest, so a discrepancy answers 1
   * and the dispatch is refused with every claim named.
   *
   * A `CardPreflightError` is NOT caught here. It means this command
   * could not look at all — an unreadable card, a parser that will not
   * load, a git that will not answer — and the outer catch turns that
   * into 3. Reporting "nothing stale" because nothing was checked is the
   * one failure this arm exists to remove.
   *
   * @type {string[]}
   */
  let preflightFindings = [];
  if (wantsPreflight) {
    if (taskId !== "" || wantsState || wantsDispatch) console.log("");
    const report = await preflight(ctx);
    preflightFindings = report.findings;
    console.log(render(report.recs));
  }

  /**
   * ARM FIVE — the dispatch-time expansion. It runs LAST of the arms that
   * derive, so a dispatcher asking for the brief and the manifest in one
   * invocation reads the brief first and the write's own stamped receipt
   * under it.
   *
   * A `LaneFenceFinding` is a fact about the REPOSITORY — an unresolvable
   * `touches:` token, a worktree on the wrong branch — so it joins the
   * findings and answers 1. Anything else propagates to the outer catch
   * and answers 3, because a missing `lib/parser/dist` is this command
   * being unable to run rather than a claim about the board.
   *
   * @type {string[]}
   */
  const fenceFindings = [];
  if (fenceWorktree !== "" && wantsPreflight && preflightFindings.length > 0) {
    // T-160's VERDICT, correction 2: the ordering above was PRINT order
    // only — arm five still wrote a manifest for a card whose claims
    // had just been refuted one screen up. The manifest is the step
    // that makes the lane real, so a failed preflight now GATES the
    // write instead of merely preceding it.
    if (taskId !== "" || wantsState || wantsDispatch || wantsPreflight) console.log("");
    console.log(
      render([
        note(
          "fence: NOT WRITTEN — the preflight above found stale claims, and a card " +
            "whose claims no longer hold does not get a",
        ),
        note(
          "manifest. Correct the card, or rule the finding ON the card (dated), then " +
            "re-run this same invocation.",
        ),
      ]),
    );
  } else if (fenceWorktree !== "") {
    if (taskId !== "" || wantsState || wantsDispatch || wantsPreflight) console.log("");
    const worktree = path.resolve(ctx.root, fenceWorktree);
    try {
      const manifest = await buildLaneFence(taskId, worktree, { root: ctx.root });
      const written = writeLaneFence(manifest);
      console.log(
        render([
          note("THE LANE FENCE MANIFEST — expanded ONCE, here, where a built parser exists"),
          value(
            `wrote: ${written.manifestFile}`,
            liveProv(ctx.at, ctx.host, "the lane worktree handed to --write-fence"),
          ),
          value(
            `lane: ${manifest.taskId} on ${manifest.branch}`,
            liveProv(ctx.at, ctx.host, "git symbolic-ref HEAD, read in that worktree"),
          ),
          value(
            `stamped from: ${manifest.card}`,
            treeProv(ctx.ref, "the card's own frontmatter, verbatim"),
          ),
          value(
            `the fence expands to: ${manifest.paths.join(", ")}`,
            treeProv(ctx.ref, "the parser's expandFence over the component registry"),
          ),
          value(
            `always writable: ${manifest.alwaysWritable.join(", ")}`,
            treeProv(ctx.ref, "the parser's UNFENCEABLE_PATHS, copied rather than restated"),
          ),
          blank(),
          note("The hook in .claude/ reads that file and nothing else. It is a runtime file, so"),
          note("a self-ignoring .gitignore goes beside it — a manifest that reached the"),
          note("integration branch would hand every checkout one lane's fence, permanently stale."),
        ]),
      );
    } catch (err) {
      if (!(err instanceof LaneFenceFinding)) throw err;
      fenceFindings.push(err.message);
    }
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
    if (taskId !== "" || wantsState || wantsDispatch || wantsPreflight) console.log("");
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
    if (taskId !== "" || wantsState || wantsDispatch || wantsPreflight || cardId !== "")
      console.log("");
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

  const findings = [
    ...ctx.findings,
    ...preflightFindings,
    ...fenceFindings,
    ...cardFindings,
    ...auditFindings,
  ];
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
