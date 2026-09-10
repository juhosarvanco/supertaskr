#!/usr/bin/env node
/**
 * THE BRIEF COMMAND (T-133) — the runnable half of `dispatch-brief.mjs`.
 *
 * THE ONE SPELLING, run from the repo ROOT and by a dispatcher with no
 * lane. Every arm but THREE is a read, and all three writers are NAMED
 * ARMS: `--write-fence` writes the lane's manifest SOMEWHERE ELSE, into
 * the lane worktree it is handed, and `--take-seat` (T-238) writes the
 * holder record into the checkout `--root` names — which is the point of
 * it, since the seat IS that checkout. Both files sit under `.supertaskr/`
 * behind the same self-ignoring `.gitignore`, so neither is ever a
 * commit.
 *
 * **THE THIRD WRITER IS `--dispatch-lane` (T-239) AND IT IS THE ONE THAT
 * COMMITS**, because the act it performs is a dispatch: it stamps the
 * card on the integration branch and commits that, cuts the lane and the
 * bench, arms the fence through the arm above, and writes the brief into
 * the lane's own scratch file. It writes NOTHING the eight hand steps did
 * not already write, and every one of those writes is named in its own
 * printed ledger. The count in the first sentence is what a reader checks
 * this against, so an arm that starts writing has to move it.
 *
 * The read arms remain exactly reads, and `brief.spec.ts`'s *"THE COMMAND
 * IS A READ"* drives an invocation that names none of the three.
 *
 *   node tools/e2e/scripts/brief.mjs --task T-133
 *   node tools/e2e/scripts/brief.mjs --state
 *   node tools/e2e/scripts/brief.mjs --task T-133 --state --full
 *   node tools/e2e/scripts/brief.mjs --card T-150
 *   node tools/e2e/scripts/brief.mjs --task T-160 --preflight
 *   node tools/e2e/scripts/brief.mjs --task T-154 --write-fence ../supertaskr-T-154
 *   node tools/e2e/scripts/brief.mjs --take-seat
 *   node tools/e2e/scripts/brief.mjs --release-seat
 *   node tools/e2e/scripts/brief.mjs --dispatch-lane T-239 --slug one-arm
 *   node tools/e2e/scripts/brief.mjs --dispatch-lane T-239 --slug one-arm --dry-run
 *
 * ARM ONE (`--task`) emits the row set of `method/roles/<role>.md`'s
 * normative contract table, each row derived from the source that row
 * names — and then, BELOW the rows and labelled as not being one of
 * them, the ADVISORY recommended-seat line (T-157, ADR-020's companion
 * adoption). That line is derived from the card's own `size:`, fence
 * kind and criteria shape, never from this session's dials; it names a
 * seat strength rather than a model, because ADR-003 settles that this
 * project passes no `--model`; and both the card's `builder:` field and
 * the role file's own run-hygiene text outrank it, which it says on
 * every run. ARM TWO (`--state`) emits the sections of docs/STATE.md a
 * command can answer — the lane list first, because it is the row both
 * consumers got wrong. They are one command because the lane list is the
 * shared row.
 *
 * ARM FIVE (`--write-fence`, T-154) is the ONE arm that writes, and the
 * DISPATCH STEP the whole T-154 mechanism rests on. It expands the card's
 * `touches:` through the parser's one fence implementation and leaves
 * `.supertaskr/lane-fence.json` in the LANE WORKTREE, so the PreToolUse hook
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
 * ARM EIGHT (`--take-seat` / `--release-seat`, T-238) is the SECOND arm
 * that writes, and it writes ONE runtime file into the checkout `--root`
 * names: `.supertaskr/holder.json`, the on-disk record of who holds the
 * integration checkout. `method/lane-protocol.md` rule 4 already rules
 * one holder at a time and says the holder is DECLARED at dispatch and
 * never inferred; until this arm there was nowhere to declare it, so two
 * sessions held that checkout at once on 2026-09-01 and neither could
 * see the other. The READ half of the same arm runs inside `--preflight`
 * and `--write-fence` — a live OTHER holder refuses the dispatch and the
 * manifest is not written, a DEAD one is announced and stepped over.
 * The identity, the measurement it rests on and every limit are
 * `checkout-currency.mjs`'s, next to the catcher that already answers
 * *which checkout is this session in*.
 *
 * ARM NINE (`--dispatch-lane`, T-239) is the RITUAL — the eight hand
 * steps of a dispatch, performed in the order orchestrator 5b, 5c and
 * CONVENTIONS' serial-ritual bullet fix, refusing at the first that
 * fails. Every step had a command before this arm and nothing joined
 * them but the dispatching seat's memory, which is where the failures
 * were: the order was inverted (T-226), four worktrees were cut before
 * any was armed (T-209's refusal), and a stamp anchored on a key the
 * card did not carry was a silent no-op. The derivation and the runner
 * are `dispatch-brief.mjs`'s, so this wrapper only wires the world into
 * them; `--dry-run` prints the plan and performs nothing.
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
import os from "node:os";
import path from "node:path";
import {
  FINDING_VERDICTS,
  auditCard,
  cardReport,
  derivedTexts,
} from "./card-figures.mjs";
import { preflight } from "./card-preflight.mjs";
import {
  DispatchLaneFinding,
  EXIT,
  assembleBrief,
  blank,
  context,
  defaultDispatchIo,
  dispatchLanePlan,
  dispatchLaneRecs,
  dispatchLedgerRecs,
  dispatchPlanRecs,
  liveProv,
  mainWorktree,
  note,
  render,
  runDispatchLane,
  stateReport,
  treeProv,
  value,
  withMargin,
  triageClusterRecs,
  wakeRecs,
} from "./dispatch-brief.mjs";
import {
  HOLDER_CODES,
  HOLDER_REL_PATH,
  STALE_CLONE_LIMIT,
  holderVerdict,
  judge as judgeCheckout,
  removeHolder,
  sessionCheckout,
  sessionIdentity,
  sweep as sweepCheckouts,
  writeHolder,
} from "./checkout-currency.mjs";
import { dispatchContext, dispatchReport, listedCards } from "./dispatch-order.mjs";
import { LaneFenceFinding, buildLaneFence, writeLaneFence } from "./lane-fence.mjs";
import { LaneLockFinding, applyLaneLock } from "./lane-lock.mjs";
import { seatRecs } from "./session-economics.mjs";

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
  "--take-seat",
  "--release-seat",
  "--dispatch-lane",
  "--slug",
  "--executor",
  "--verifier",
  "--scratch",
  "--dry-run",
  "--full",
  "--help",
]);

/**
 * THE ANSWER IS COLLECTED BEFORE IT IS WRITTEN (T-225), and the reason is
 * the disclosure rather than the writing.
 *
 * A command cannot state its own size until it has one, and the
 * disclosure has to go AHEAD of the answer because a truncation eats the
 * tail — a margin line at the foot of an answer too big to arrive is lost
 * in the one case it was written for. So every arm renders into here and
 * the whole thing goes out in one write, with the margin block in front
 * of it.
 *
 * THE CRASH PATH KEEPS WHAT WAS DERIVED. Arms used to print as they ran,
 * so a throw in a later arm still left the earlier ones on the reader's
 * screen; the flush below therefore runs in the catch as well, ahead of
 * the message. Losing five derived rows to make room for a stack trace
 * would be this command telling a reader less than it knew.
 *
 * @type {string[]}
 */
const OUT = [];

/** @param {string} text */
function say(text) {
  OUT.push(text);
}

/**
 * The units the margin's per-card density is divided by, set by whichever
 * arm has a card count to give. Left undefined by the arms that do not:
 * a density over a denominator this command did not derive would be a
 * figure with no keeper, which is the defect this whole file is against.
 *
 * @type {{ count: number, label: string } | undefined}
 */
let UNITS;

/**
 * Write the collected answer, disclosing its own size ahead of it.
 *
 * The margin's stamp is a LIVE read and takes its own clock: it is a fact
 * about this invocation's output rather than about the tree, and the
 * measurement happens HERE, at the write, not when any arm ran.
 */
function flush() {
  if (OUT.length === 0) return;
  const answer = withMargin(OUT.map((s) => `${s}\n`).join(""), {
    at: new Date().toISOString(),
    host: os.hostname(),
    ...(UNITS === undefined ? {} : { units: UNITS }),
  });
  process.stdout.write(answer.text);
  OUT.length = 0;
}

/** @param {string[]} argv @returns {Promise<number>} */
async function main(argv) {
  /** @type {Record<string, string>} */
  const opts = {};
  let wantsState = false;
  let wantsDispatch = false;
  let wantsPreflight = false;
  let wantsTakeSeat = false;
  let wantsReleaseSeat = false;
  let dryRun = false;
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
          "[--write-fence <worktree>] [--take-seat] [--release-seat] " +
          "[--dispatch-lane <T-NNN> --slug <slug> [--executor <seat>] [--verifier <seat>] " +
          "[--scratch <dir>] [--dry-run]] [--full] [--root <path>]",
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
    if (a === "--take-seat") {
      wantsTakeSeat = true;
      continue;
    }
    if (a === "--release-seat") {
      wantsReleaseSeat = true;
      continue;
    }
    if (a === "--dry-run") {
      dryRun = true;
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
  const laneId = opts["dispatch-lane"] ?? "";
  const wantsDispatchLane = laneId !== "";
  /**
   * THE RITUAL'S OWN DIALS, AND EVERY ONE OF THEM IS MEANINGLESS ALONE.
   * A `--slug` with no `--dispatch-lane` is a lane name for a lane nobody
   * asked to cut, and this command answers that with USAGE rather than
   * ignoring it — a flag silently dropped is a dispatcher believing it
   * said something it did not.
   */
  const laneDials = ["slug", "executor", "verifier", "scratch"];
  const strayDials = laneDials.filter((d) => opts[d] !== undefined);
  if (!wantsDispatchLane && (strayDials.length > 0 || dryRun)) {
    console.error(
      `brief: ${[...strayDials.map((d) => `--${d}`), ...(dryRun ? ["--dry-run"] : [])].join(", ")} ` +
        "only mean something to --dispatch-lane <T-NNN>, and nothing else on this command reads " +
        "them. A flag this command accepted and ignored is a dispatcher who believes it said " +
        "something it did not.",
    );
    return EXIT.USAGE;
  }
  if (wantsDispatchLane && (opts["slug"] ?? "") === "") {
    console.error(
      "brief: --dispatch-lane needs --slug <slug> — the branch name is what `git branch` shows for " +
        "the life of this repository, and it is the ONE thing in the ritual the documents leave to " +
        "the dispatcher. This command has declined to invent one since T-133 and still does.",
    );
    return EXIT.USAGE;
  }
  if (wantsDispatchLane && fenceWorktree !== "") {
    console.error(
      "brief: --dispatch-lane already performs --write-fence, as its fourth step and against the " +
        "worktree it cut at its second. Asking for both in one invocation is asking for the fence " +
        "to be written twice, at two worktrees, in an order neither flag states.",
    );
    return EXIT.USAGE;
  }
  if (wantsDispatchLane && (wantsTakeSeat || wantsReleaseSeat)) {
    console.error(
      "brief: --dispatch-lane is an act IN the integration checkout and the seat arms decide WHO " +
        "may act in it, so one invocation cannot do both — take the seat, then dispatch. A " +
        "dispatch that claimed the seat for itself would be the collision method/lane-protocol.md " +
        "rule 4 rules against, performed by the guard.",
    );
    return EXIT.USAGE;
  }
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
  if (wantsTakeSeat && wantsReleaseSeat) {
    console.error(
      "brief: --take-seat and --release-seat in one invocation is not a request this command can " +
        "answer — taking a seat and giving it up are opposite acts, and a command that did both " +
        "would leave the checkout in whichever state the argument order happened to produce.",
    );
    return EXIT.USAGE;
  }
  if (
    taskId === "" &&
    cardId === "" &&
    auditPath === "" &&
    !wantsState &&
    !wantsDispatch &&
    !wantsPreflight &&
    !wantsTakeSeat &&
    !wantsReleaseSeat &&
    !wantsDispatchLane
  ) {
    console.error(
      "brief: nothing asked for — give --task <T-NNN> for a dispatch brief, --state for the " +
        "sections of docs/STATE.md a command can answer, --dispatch for what is startable now " +
        "and why the rest are not, --card <T-NNN> for the figures a card author would " +
        "otherwise type, --take-seat or --release-seat for the integration checkout's holder, " +
        "--dispatch-lane <T-NNN> --slug <slug> to perform the whole dispatch ritual, " +
        "or any combination.\n" +
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

  /**
   * ARM SEVEN — THE STALE-CHECKOUT CATCHER, AT ARM TIME (T-216-s1).
   *
   * A `PreToolUse` hook is only as current as the checkout the SESSION
   * was started in, and an ABSENT hook cannot announce itself — so the
   * catcher has to run WHERE THE GUARD IS NOT. **This is that place.**
   * The dispatch ritual's arming steps are `--preflight` and
   * `--write-fence`; both run here, from THIS checkout's own copy of the
   * catcher, against the checkout the harness loaded its settings from.
   * `--dispatch-lane` (T-239) performs both as its third and fourth
   * steps, so it arms this catcher too — one condition, `arming` below,
   * rather than three call sites that can drift apart.
   *
   * IT RUNS BEFORE THE CARD IS EVEN LOOKED UP, so a dispatch that fails
   * for any other reason has still been told. A guard that speaks only on
   * the happy path is one nobody hears at the moment it matters.
   *
   * WHAT IT JUDGES AND FROM WHERE ARE BOTH DERIVED, AND BOTH ARE
   * LOAD-BEARING: the TARGET is `sessionCheckout()` — `CLAUDE_PROJECT_DIR`
   * where the harness exports it, else the WORKTREE ROOT containing this
   * command's working directory when that root is a checkout of this
   * repository — and the VANTAGE is the checkout the catcher's own file
   * lives in. In the measured instance those were two DIFFERENT
   * checkouts, which is exactly the split this arm sees.
   *
   * **AN EARLIER BUILD OF THIS ARM READ `CLAUDE_PROJECT_DIR` AND NOTHING
   * ELSE, AND WAS REJECTED FOR IT.** That variable is exported to HOOK
   * commands and NOT to Bash tool calls, so the arming step — typed at a
   * shell — took the "nothing declared" branch every time, and the only
   * path to a STALE verdict was reachable from a fixture. A catcher that
   * is called and always declines is the same defect as one nothing
   * calls. `sessionCheckout` carries the measurement.
   *
   * **AND THE SWEEP IS THE HALF THAT CANNOT BE DEFEATED.** Every way of
   * naming *the session's own checkout* can be wrong; `sweep` asks which
   * checkouts of this repository load stale guards, off git's own
   * worktree administration, so the session's is in the answer whether or
   * not anything could name it. It REPORTS rather than refuses — a gate
   * that reds on every dispatch because some detached tree is permanently
   * behind is a gate this project would learn to ignore, which is the
   * same reason the guard-surface arm is not a commit count.
   *
   * A STALE verdict on the RESOLVED TARGET joins the findings and the
   * dispatch answers 1. An UNKNOWN one does not: it means a question
   * could not be ASKED, and turning an inability into a verdict is the
   * failure every other arm of this command already refuses.
   *
   * @type {string[]}
   */
  const sessionFindings = [];
  /** Every invocation that ARMS a lane, and therefore owes the catcher below. */
  const arming = wantsPreflight || fenceWorktree !== "" || wantsDispatchLane;
  const session = arming ? sessionCheckout() : undefined;
  if (arming && session === undefined) {
    // NEITHER SIGNAL RESOLVED: no `CLAUDE_PROJECT_DIR`, and this command's
    // working directory is not inside a checkout of this repository. That
    // is genuinely unanswerable — and it is NOT production's shape, which
    // is the correction this branch was narrowed by. Three verdicts,
    // never two: said out loud and charged to nobody. The sweep below
    // still runs, and still names every stale checkout on this machine.
    say(
      render([
        note("THE SESSION'S OWN CHECKOUT — the copy of the guards this sitting actually loaded"),
        note("UNANSWERED: no session checkout could be resolved. CLAUDE_PROJECT_DIR is unset"),
        note("AND this command is not being run from inside a checkout of this repository, so"),
        note("there is no signal to derive one from. The SWEEP below needed none of that."),
      ]),
    );
  } else if (session !== undefined) {
    const currency = judgeCheckout({ target: session.path });
    say(
      render([
        note("THE SESSION'S OWN CHECKOUT — the copy of the guards this sitting actually loaded"),
        value(
          `verdict: ${currency.verdict}`,
          liveProv(ctx.at, ctx.host, "checkout-currency.mjs, run from this checkout's own copy"),
        ),
        value(
          `judged: ${session.path}`,
          liveProv(ctx.at, ctx.host, `${session.source}: ${session.how}`),
        ),
        value(
          `from: ${String(currency.figures["vantage"])}`,
          liveProv(ctx.at, ctx.host, "the checkout checkout-currency.mjs itself lives in"),
        ),
        // EVERY LINE BELOW IS A STAMPED VALUE AND NOT A NOTE, because
        // this module refuses a note that carries a digit — a figure with
        // no ref is the defect this whole command exists to stop, and a
        // hash inside a finding is a figure like any other.
        ...currency.findings.map((f) =>
          value(
            `STALE [${f.code}] ${f.detail}`,
            liveProv(ctx.at, ctx.host, "checkout-currency.mjs, judging that checkout's own disk"),
          ),
        ),
        ...currency.unanswered.map((f) =>
          value(
            `UNANSWERED [${f.code}] ${f.detail}`,
            liveProv(ctx.at, ctx.host, "checkout-currency.mjs, a question it could not ask"),
          ),
        ),
        note(STALE_CLONE_LIMIT),
      ]),
    );
    for (const f of currency.findings) {
      sessionFindings.push(
        `the checkout this session was started in is STALE [${f.code}] — ${f.detail}`,
      );
    }
  }

  // THE SWEEP — asked of git's own worktree administration, so it needs
  // no environment variable, no flag and no working directory to be
  // right. It runs whether or not the target above resolved, which is the
  // whole point: the checkout a session was started in appears here by
  // construction even when nothing could name it.
  if (arming) {
    const results = sweepCheckouts();
    const stale = results.filter((r) => r.decision.verdict === "stale");
    say(
      render([
        note("EVERY CHECKOUT OF THIS REPOSITORY ON THIS MACHINE — the sweep that needs nothing"),
        note("declared, so a session's own checkout is in it whether or not anything can name it"),
        ...results.map((r) =>
          value(
            `${r.decision.verdict}: ${r.checkout} @ ${r.head.slice(0, 7)}` +
              `${r.decision.findings.length === 0 ? "" : ` — ${r.decision.findings.map((f) => f.code).join(", ")}`}`,
            liveProv(ctx.at, ctx.host, "git worktree list --porcelain, read in the vantage"),
          ),
        ),
        ...(stale.length === 0
          ? [note("Every checkout on this machine loads the guards this project registers.")]
          : [
              note("A SESSION STARTED IN ANY CHECKOUT MARKED STALE ABOVE RUNS THE GUARDS THAT"),
              note("CHECKOUT CARRIES, WHICH ARE NOT THE ONES THIS PROJECT REGISTERS. Reported"),
              note("rather than refused: a permanently-behind detached tree must not red every"),
              note("dispatch, or this becomes the gate nobody reads."),
            ]),
      ]),
    );
  }

  /**
   * ARM EIGHT — THE HOLDER OF THE INTEGRATION CHECKOUT (T-238).
   *
   * `method/lane-protocol.md` rule 4 rules ONE holder at a time and says
   * the holder is DECLARED at dispatch, never inferred. Until this arm
   * the declaration existed only in prose, so on 2026-09-01 two sessions
   * held that checkout at once — one mid-battery and then mid-checkpoint
   * — and neither could see the other. `checkout-currency.mjs` carries
   * the record, the identity derivation and the measurement it rests on;
   * this arm is where the dispatch ritual READS it.
   *
   * IT JUDGES `ctx.root` AND NOT THE CWD, and that is the opposite choice
   * from arm seven's, deliberately. Arm seven asks *which copy of the
   * guards did this SESSION load*, which is a fact about where the seat
   * is sitting. This one asks *who is acting in the checkout this
   * dispatch is ABOUT*, and the checkout being armed is exactly what
   * `--root` names.
   *
   * WHAT IT DOES WITH EACH ANSWER: a LIVE other holder is a FINDING, so
   * the dispatch answers 1 and — like a failed preflight — the fence is
   * not written. A DEAD holder, an UNREADABLE record and a checkout that
   * is NOT the integration one are ANNOUNCED and proceed: three verdicts
   * never two, and an inability may not become a verdict. A VACANT
   * checkout is announced with the one command that claims it. THE SEAT
   * BEING THIS SESSION'S IS THE ONLY SILENT ANSWER — the second
   * acceptance criterion says the arming steps proceed silently there,
   * and a line printed on every ordinary dispatch is a line nobody reads
   * by the third one.
   *
   * @type {string[]}
   */
  const holderFindings = [];
  const holder =
    arming || wantsTakeSeat || wantsReleaseSeat ? holderVerdict({ root: ctx.root }) : undefined;
  if (holder !== undefined && holder.state !== "mine") {
    say(
      render([
        note("THE HOLDER OF THE INTEGRATION CHECKOUT — declared at dispatch, never inferred"),
        value(
          `holder: ${holder.state} [${holder.code}]`,
          liveProv(ctx.at, ctx.host, `checkout-currency.mjs, over ${HOLDER_REL_PATH} and ps`),
        ),
        value(
          holder.detail,
          liveProv(ctx.at, ctx.host, "the holder record on disk, and the process table"),
        ),
      ]),
    );
  }
  if (holder !== undefined && holder.state === "held") {
    holderFindings.push(
      `the integration checkout is held by another live session — ${holder.detail}`,
    );
  }

  /**
   * TAKING AND RELEASING THE SEAT — the explicit arm the declaration
   * needs, because rule 4's holder is DECLARED and a declaration nobody
   * performs is the state this card found.
   *
   * `--take-seat` refuses a checkout somebody else is live in, takes over
   * a DEAD holder's record while ANNOUNCING whose it was, and writes
   * otherwise. `--release-seat` gives it up, and refuses to remove a
   * record it cannot show belongs to this session — removing another
   * seat's declaration is the one harm this arm could do.
   *
   * **AND IT REFUSES AN UNREADABLE RECORD TOO** (T-238-s1). That is the
   * same harm reached by a different route: a record whose SHAPE this
   * reader cannot parse says nothing about whose it is, so removing it
   * retires an unread claim — and the arm used to do exactly that and
   * print RELEASED. `--take-seat` remains the way past it, because an
   * explicit claim is a different act from a release stepping over
   * evidence it never read.
   *
   * THE ONE EARLY RETURN IS AN INABILITY. A session whose own identity
   * cannot be derived cannot record anything on its own behalf, and that
   * is `COULD NOT RUN` rather than a finding about the checkout: the
   * house contract keeps "I derived it and found something" apart from
   * "I could not tell you", and this is squarely the second.
   */
  if (wantsTakeSeat || wantsReleaseSeat) {
    const h = /** @type {NonNullable<typeof holder>} */ (holder);
    const asked = wantsTakeSeat ? "--take-seat" : "--release-seat";
    say("");
    if (h.state === "not-integration") {
      say(
        render([
          note("THE SEAT — nothing was taken and nothing was released"),
          value(
            `${asked} was asked of ${ctx.root}, which is not the integration checkout`,
            liveProv(ctx.at, ctx.host, "git symbolic-ref HEAD, read in that checkout"),
          ),
        ]),
      );
      holderFindings.push(
        `${asked} was asked of a checkout that is not the integration one — ${h.detail}`,
      );
    } else if (h.state === "held") {
      // The refusal's sentence is already printed and already a finding;
      // this line says only which act it refused, so a reader does not
      // have to infer it from the invocation.
      say(
        render([
          note("THE SEAT — REFUSED, and the sentence above says by whom"),
          value(
            `${asked} was refused: another live session holds ${ctx.root}`,
            liveProv(ctx.at, ctx.host, `${HOLDER_REL_PATH}, and the process table`),
          ),
        ]),
      );
    } else if (wantsTakeSeat) {
      const mine = sessionIdentity();
      if (!mine.ok) {
        console.error("brief: COULD NOT RUN");
        console.error(`  ${mine.why}`);
        console.error(
          "  Nothing was written. A session that cannot name itself cannot record a claim on " +
            "its own behalf, and a record naming nobody would refuse every other session for ever.",
        );
        flush();
        return EXIT.CANNOT_RUN;
      }
      const written = writeHolder(ctx.root, mine.identity, { at: ctx.at, host: ctx.host });
      say(
        render([
          note("THE SEAT — TAKEN. Every arming step and every push in this checkout now reads it"),
          ...(h.state === "dead"
            ? [
                value(
                  `TAKEN OVER from a dead holder: ${h.detail}`,
                  liveProv(ctx.at, ctx.host, "the record that was there, and the process table"),
                ),
              ]
            : []),
          value(
            `holder: pid ${String(mine.identity.pid)} started ${mine.identity.startedAt}`,
            liveProv(ctx.at, ctx.host, "ps, walked up from this process to the harness"),
          ),
          value(
            `wrote: ${written.file}`,
            liveProv(ctx.at, ctx.host, "the checkout --root names, which is the seat"),
          ),
          value(
            `un-committable by: ${written.ignoreFile}`,
            liveProv(ctx.at, ctx.host, "the same armRuntimeDir the gate token and the fence use"),
          ),
          // A STAMPED VALUE AND NOT A NOTE, because `dispatch-brief.mjs`
          // refuses a note carrying a digit and this command's own path
          // has one in it. The rule caught this line rather than the
          // reader having to.
          value(
            "release it when you retire: node tools/e2e/scripts/brief.mjs --release-seat",
            liveProv(ctx.at, ctx.host, "this command's own spelling, from docs/CONVENTIONS.md"),
          ),
        ]),
      );
    } else if (h.code === HOLDER_CODES.UNREADABLE) {
      // ── ITEM 2 OF T-238-s1 ────────────────────────────────────────
      // A RECORD THIS COMMAND COULD NOT READ WAS REMOVED AND REPORTED
      // AS "RELEASED … unopposed". `unknown` has two codes and only one
      // of them was caught here: the branch above tests
      // `figures.holderAlive === true`, which is set only when the
      // record PARSED — so an UNREADABLE record fell through to the
      // release below, was deleted, and the seat was told the next
      // session takes it unopposed. Neither half was true: nothing had
      // established the seat was free, and the one piece of evidence
      // about who held it was what got deleted.
      //
      // AND THE REMEDY IS NOT LOST, it moves to the arm that owns it:
      // `holderVerdict`'s own sentence for this state is *delete the
      // file or re-take the seat*, and `--take-seat` still does exactly
      // that — an explicit claim, which is a different act from a
      // release stepping over a record it never read.
      say(
        render([
          note("THE SEAT — NOT RELEASED. The record on disk is a SHAPE this reader cannot read,"),
          note("so who holds this checkout was never established; removing it would retire an"),
          note("unread claim and destroy the only evidence of whose it was."),
          value(
            `${asked} refused: ${h.detail}`,
            liveProv(ctx.at, ctx.host, `${HOLDER_REL_PATH}, as it is on disk`),
          ),
        ]),
      );
      holderFindings.push(
        `--release-seat refused an unreadable ${HOLDER_REL_PATH} rather than removing it — ` +
          `${h.detail} Take the seat explicitly (--take-seat) if it is yours, or delete the file ` +
          "by hand once you have read it.",
      );
    } else if (h.state === "unknown" && h.figures["holderAlive"] === true) {
      say(
        render([
          note("THE SEAT — NOT RELEASED. A live record this session cannot show is its own is"),
          note("not this session's to remove; removing it would retire somebody else's claim."),
        ]),
      );
      holderFindings.push(`--release-seat could not establish that the live holder is this session — ${h.detail}`);
    } else {
      /** @type {boolean} */
      let had;
      try {
        had = removeHolder(ctx.root);
      } catch (err) {
        // A REMOVAL THAT FAILED IS NOT A RELEASE (T-238-s1). `rmSync`
        // throwing anything but ENOENT means the record is still there,
        // and this command's four-code contract keeps "I could not do
        // it" apart from "I did it and found nothing".
        console.error("brief: COULD NOT RUN");
        console.error(`  ${err instanceof Error ? err.message : String(err)}`);
        console.error(
          "  The seat was NOT released and the record is still on disk. Nothing here has said " +
            "this checkout is free.",
        );
        flush();
        return EXIT.CANNOT_RUN;
      }
      say(
        render([
          note("THE SEAT — RELEASED. The next session to arm this checkout takes it unopposed"),
          value(
            had ? `removed: ${HOLDER_REL_PATH}` : `nothing to remove: ${HOLDER_REL_PATH} was absent`,
            liveProv(ctx.at, ctx.host, "the checkout --root names, which is the seat"),
          ),
        ]),
      );
    }
  }

  /**
   * ARM NINE — THE RITUAL (T-239).
   *
   * The eight hand steps, in the order orchestrator 5b, 5c and
   * CONVENTIONS' serial-ritual bullet fix, refusing at the first that
   * fails. The plan is derived by `dispatchLanePlan` and performed by
   * `runDispatchLane`; this block wires the real world into them and
   * renders what came back.
   *
   * TWO REFUSALS COME BEFORE THE FIRST STEP, and both are about the SEAT
   * rather than about the card. A checkout that is not the integration
   * one has no lane to dispatch FROM — the stamp belongs on the
   * integration branch (orchestrator 5b) and a lane does not hold that
   * seat — and a checkout another live session holds is rule 4's
   * collision, refused here at the one moment it is cheap. Both are the
   * third acceptance criterion, and both answer 1: this command derived
   * the checkout's own HEAD ref and FOUND something, which is not the
   * same as being unable to look.
   *
   * @type {string[]}
   */
  const laneFindings = [];
  if (wantsDispatchLane) {
    const h = /** @type {NonNullable<typeof holder>} */ (holder);
    say("");
    if (h.state === "not-integration") {
      say(
        render([
          note("THE DISPATCH — REFUSED before its first step, and nothing was written"),
          value(
            `--dispatch-lane was asked of ${ctx.root}, which is not the integration checkout`,
            liveProv(ctx.at, ctx.host, "git symbolic-ref HEAD, read in that checkout"),
          ),
        ]),
      );
      laneFindings.push(
        `--dispatch-lane was asked of a checkout that is not the integration one — ${h.detail} ` +
          "The dispatch stamp goes on the integration branch and the lane inherits it in its base " +
          "(method/roles/orchestrator.md 5b), so there is nothing here to dispatch from.",
      );
    } else if (h.state === "held") {
      // The holder's own sentence is already printed and already a
      // finding; this line says only which act it refused.
      say(
        render([
          note("THE DISPATCH — REFUSED, and the sentence above says by whom"),
          value(
            `--dispatch-lane was refused: another live session holds ${ctx.root}`,
            liveProv(ctx.at, ctx.host, `${HOLDER_REL_PATH}, and the process table`),
          ),
        ]),
      );
    } else {
      try {
        const plan = dispatchLanePlan(ctx, {
          taskId: laneId,
          slug: /** @type {string} */ (opts["slug"]),
          ...(opts["executor"] === undefined ? {} : { executor: opts["executor"] }),
          ...(opts["verifier"] === undefined ? {} : { verifier: opts["verifier"] }),
          ...(opts["scratch"] === undefined ? {} : { scratch: opts["scratch"] }),
        });
        if (dryRun) {
          say(render(dispatchPlanRecs(ctx, plan)));
        } else {
          const result = runDispatchLane(plan, defaultDispatchIo());
          say(render(dispatchLedgerRecs(ctx, result)));
          say("");
          say(render(dispatchLaneRecs(ctx, plan, result)));
          for (const f of result.findings) laneFindings.push(f);
          if (result.code === EXIT.CANNOT_RUN) {
            console.error("brief: COULD NOT RUN");
            for (const f of result.findings) console.error(`  ${f}`);
            flush();
            return EXIT.CANNOT_RUN;
          }
        }
      } catch (err) {
        if (err instanceof DispatchLaneFinding) {
          laneFindings.push(err.message);
        } else throw err;
      }
    }
  }

  if (taskId !== "") {
    if (ctx.card === undefined) {
      console.error(
        `brief: no live card declares id ${taskId} — the board is read off the tree (flat ` +
          "docs/tasks/T-*.md), so an id with no card is a question about a card that is not there.",
      );
      return EXIT.USAGE;
    }
    const { recs } = assembleBrief(ctx);
    say(render(recs));
    // THE ADVISORY LINE, PRINTED AFTER THE ROWS AND OUTSIDE THEM (T-157).
    // It is not a contract row and must never look like one: the row set
    // is read from the role file, and a fourteenth row this command
    // invented would be exactly the second row set that `assembleBrief`
    // reports as a finding. It sits here rather than inside that function
    // so the contract half stays exactly the contract.
    say(render(seatRecs(ctx)));
  }

  if (wantsState) {
    if (taskId !== "") say("");
    say(render(stateReport(ctx)));
  }

  if (wantsDispatch) {
    if (taskId !== "" || wantsState) say("");
    // `--full` reaches this arm as the UNFILTERED view (T-225): the
    // default answers what a session could START, and every set that is
    // not startable collapses to one counted line. The flag is the same
    // one arm one already spends on its own prose — one dial for "spell
    // it out", not a second vocabulary.
    const dctx = await dispatchContext({
      ...(opts["root"] === undefined ? {} : { root: opts["root"] }),
      full,
    });
    UNITS = { count: listedCards(dctx), label: "listed card" };
    say(render(dispatchReport(dctx)));
    // T-282's triage clusters — the section criterion 1 names, rendered
    // from the same context the report reads (the wiring T-282-s1 owed).
    if (full) say(render(triageClusterRecs(dctx)));
    // T-285's woken parked cards — the section criterion 2 names,
    // rendered from the same context. UNGUARDED, unlike the clusters
    // above, and the difference is the question each answers: this
    // command's default view is *what can I start?*, a parked card whose
    // condition now holds is a candidate for exactly that, and the
    // failure the card was filed against is cards being FORGOTTEN. So
    // `wakeRecs` spends `ctx.full` itself — one counted line by default,
    // the page behind the flag.
    say(render(wakeRecs(dctx)));
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
    if (taskId !== "" || wantsState || wantsDispatch) say("");
    const report = await preflight(ctx);
    preflightFindings = report.findings;
    say(render(report.recs));
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
  // T-238: A SECOND GATE ON THE SAME WRITE, AND IT IS THE SAME ARGUMENT.
  // The manifest is the step that makes the lane real, so a dispatcher
  // who is not the seat holding this checkout does not perform it —
  // rule 4's collision, refused at the one moment it is cheap. It is
  // spelled as a separate condition rather than folded into the
  // preflight's because a `--write-fence` with no `--preflight` is a
  // legal invocation and the holder still governs it.
  const heldByAnother = holder !== undefined && holder.state === "held";
  if (
    fenceWorktree !== "" &&
    ((wantsPreflight && preflightFindings.length > 0) || heldByAnother)
  ) {
    // T-160's VERDICT, correction 2: the ordering above was PRINT order
    // only — arm five still wrote a manifest for a card whose claims
    // had just been refuted one screen up. The manifest is the step
    // that makes the lane real, so a failed preflight now GATES the
    // write instead of merely preceding it.
    if (taskId !== "" || wantsState || wantsDispatch || wantsPreflight) say("");
    say(
      render(
        heldByAnother
          ? [
              note(
                "fence: NOT WRITTEN — another live session holds this integration checkout, and " +
                  "arming a lane is an act",
              ),
              note(
                "in it. The refusal above names the holder and the remedy; re-run this same " +
                  "invocation once the seat is yours.",
              ),
            ]
          : [
              note(
                "fence: NOT WRITTEN — the preflight above found stale claims, and a card " +
                  "whose claims no longer hold does not get a",
              ),
              note(
                "manifest. Correct the card, or rule the finding ON the card (dated), then " +
                  "re-run this same invocation.",
              ),
            ],
      ),
    );
  } else if (fenceWorktree !== "") {
    if (taskId !== "" || wantsState || wantsDispatch || wantsPreflight) say("");
    // THE SECOND MEMBER OF ROW 4'S CLASS, AND THE ONE THAT WRITES (T-179).
    // This resolved a relative `--write-fence` argument against `ctx.root`
    // — the checkout the command ran in — which is the same base row 4 was
    // fixed for and the same wrong answer from a nested worktree: the
    // dispatcher who pastes CONVENTIONS' published `../supertaskr-T-NNN` gets a
    // manifest aimed one directory inside `.claude/worktrees/`. It is
    // WORSE than the row, because the row is read and this one acts. One
    // base, derived once, spent by both. An ABSOLUTE argument is untouched
    // by either spelling, which is what the dispatch flow already passes.
    const repo = mainWorktree(ctx.porcelain);
    if (repo.path === "" && !path.isAbsolute(fenceWorktree)) {
      console.error(
        `brief: --write-fence was given the relative path ${JSON.stringify(fenceWorktree)} and ` +
          `${repo.reason} A relative worktree path has as many readings as there are directories ` +
          "to run from, and this command will not pick one — state it absolutely.",
      );
      return EXIT.CANNOT_RUN;
    }
    const worktree = path.resolve(repo.path === "" ? ctx.root : repo.path, fenceWorktree);
    try {
      const manifest = await buildLaneFence(taskId, worktree, { root: ctx.root });
      const written = writeLaneFence(manifest);
      // THE PHYSICAL LAYER IS ARMED FROM THE MANIFEST JUST WRITTEN (T-210).
      // ONE EVENT, NOT TWO: a fence WIDENING is this same command run again
      // (T-211 fast path A — "the dispatch step performed again, never a
      // different act"), so arming here covers the widening as well and
      // there is no second trigger to forget. `applyLaneLock` re-baselines
      // rather than adding, so a path that has just been granted gets its
      // write bit back in the same motion the manifest gains it.
      const lock = applyLaneLock(worktree);
      say(
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
          // A NOTE MAY NOT CARRY A DIGIT — this module's own provenance rule,
          // which refused these four lines while they still cited the card by
          // id and was right to. Every figure below is a stamped value.
          note("THE PHYSICAL LAYER, ARMED FROM THAT MANIFEST — out-of-fence TRACKED files are"),
          note("now read-only, so a write through a shell fails with EACCES rather than being"),
          note("parsed. It covers the vector the hook cannot see and misses the one the hook"),
          note("catches; neither layer is sufficient alone."),
          value(
            `read-only: ${lock.locked} of ${lock.tracked} tracked · writable: ${lock.writable}`,
            liveProv(ctx.at, ctx.host, "chmod over `git ls-files`, read in the lane worktree"),
          ),
          value(
            `drop it around a checkpoint sync: node tools/e2e/scripts/lane-lock.mjs --release --worktree ${worktree}`,
            liveProv(ctx.at, ctx.host, "the lane worktree handed to --write-fence"),
          ),
          blank(),
          note("The hook in .claude/ reads that file and nothing else. It is a runtime file, so"),
          note("a self-ignoring .gitignore goes beside it — a manifest that reached the"),
          note("integration branch would hand every checkout one lane's fence, permanently stale."),
        ]),
      );
      if (lock.failures.length > 0) {
        // A PARTIAL ARM IS A FINDING, NOT A WARNING. The manifest is
        // written and the hook guards regardless, but a physical layer that
        // covered most of the tree would be a guard trusted further than it
        // measures — this repository's most repeated defect.
        fenceFindings.push(
          `the physical fence layer could not lock ${lock.failures.length} path(s) — ` +
            lock.failures.map((f) => `${f.path} (${f.error})`).join("; "),
        );
      }
    } catch (err) {
      if (err instanceof LaneLockFinding) {
        fenceFindings.push(err.message);
      } else if (err instanceof LaneFenceFinding) {
        fenceFindings.push(err.message);
      } else throw err;
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
    if (taskId !== "" || wantsState || wantsDispatch || wantsPreflight) say("");
    say(render(report.recs));
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
      say("");
    say(
      render([
        note("THE AUDIT, over a file that is not a card"),
        // The path goes out as a stamped VALUE and not as a note, because a
        // note may not carry a digit and a path routinely does. That rule is
        // dispatch-brief.mjs's and it is doing exactly its job here.
        value(`audited file: ${auditPath}`, treeProv(cardCtx.ref, "the path handed to --audit")),
      ]),
    );
    if (figures.length === 0) {
      say(
        render([note("  no figure in it claims a provenance and no census claim is made")]),
      );
    }
    for (const f of figures) {
      say(
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
    ...sessionFindings,
    ...holderFindings,
    ...laneFindings,
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

/**
 * THE READER THAT WALKS AWAY IS ANSWERED DELIBERATELY (T-225-s2, taking
 * `T-225-s6`).
 *
 * A reader that takes ONE fixed-size read and stops — `| head`, `| dd
 * bs=65536 count=1`, a pager closed on the first screen — closes the pipe
 * under a writer that is still writing. Node does not raise SIGPIPE; it
 * raises an `EPIPE` on the stream, and an `error` event with no listener
 * is an uncaught exception: **a stack trace on stderr and exit 1.**
 *
 * **EXIT 1 IS `EXIT.FOUND`, WHICH IS THE WHOLE DEFECT.** Measured on the
 * dispatching seat's bench at `09526da`, 40 runs of `--dispatch --full`
 * into `dd bs=65536 count=1`: the writer exited 0 in 37 and 1 in 3 (1 of
 * 30 quiet, 2 of 10 under eight-core load), and every non-zero was that
 * uncaught EPIPE rather than a finding. So a caller reading the writer's
 * `$?` could not tell *"the assembler found something the repository
 * disagrees with"* from *"you closed the pipe"* — two answers this
 * command's own four-code contract exists to keep apart.
 *
 * **THE MAPPING IS `CANNOT_RUN`, AND THE REASON IS THE CONTRACT'S OWN
 * WORDING.** Code 3 is *"the command COULD NOT RUN, so this run is not a
 * claim about the repository at all"* — and a closed pipe is exactly
 * that shape seen from the other end: the derivation happened, the
 * TELLING did not, and what the reader holds is a prefix rather than an
 * answer. It is not 0 (the answer did not arrive), it is not 1 (nothing
 * was found), and it is not 2 (the invocation was fine).
 *
 * **WHAT THIS DOES NOT DO IS END THE RACE, AND NOTHING HERE PRETENDS
 * OTHERWISE.** Whether the EPIPE reaches this process before it exits is
 * still timing, so the writer's own exit behind such a reader is 0 or 3
 * depending on the machine. What changes is that the non-zero is now
 * DISTINCT from a finding and carries a sentence instead of a stack
 * trace. `tests/brief-flush.spec.ts` measures the spread per run and
 * asserts nothing about which side of it a given run lands on — the
 * reader's side is the property, and it is asserted there.
 */
process.stdout.on("error", (err) => {
  const errno = /** @type {NodeJS.ErrnoException} */ (err).code;
  if (errno === "EPIPE") {
    process.exitCode = EXIT.CANNOT_RUN;
    return;
  }
  // ANY OTHER STDOUT FAILURE IS THE SAME CLASS AND IS NAMED RATHER THAN
  // THROWN: this run is not a claim about the repository either, and a
  // stack trace out of a stream event would land at exit 1 beside the
  // findings again.
  process.exitCode = EXIT.CANNOT_RUN;
  console.error(`brief: COULD NOT WRITE THE ANSWER — ${err instanceof Error ? err.message : String(err)}`);
});

let code;
try {
  code = await main(process.argv.slice(2));
  flush();
} catch (err) {
  // THE DERIVED ROWS GO OUT FIRST, THEN THE REFUSAL. Before T-225 each arm
  // printed as it ran, so a throw in a later arm left the earlier ones on
  // the reader's screen; collecting the answer to disclose its size must
  // not quietly cost that.
  flush();
  console.error("brief: COULD NOT RUN");
  console.error(`  ${err instanceof Error ? err.message : String(err)}`);
  console.error(
    "  This run is not a claim about the repository — it is a claim about this command. " +
      "Nothing was written.",
  );
  code = EXIT.CANNOT_RUN;
}
/**
 * THE EXIT IS A CODE, NEVER A CALL (T-197). This line was
 * `process.exit(code)`, and that single call silently truncated this
 * command's own derivation.
 *
 * **Node's stdout is ASYNCHRONOUS when it is a pipe** and synchronous
 * when it is a file or a TTY. `process.exit()` tears the process down
 * with the write queue still draining, so to a file the write completed
 * and to a pipe it did not — at exit 0, with no error printed, ending
 * mid-derivation looking like a complete answer. **The tool whose whole
 * contract is a trustworthy figure was one buffer away from lying**, and
 * the reader who piped it into `head`, `grep` or `less` — the ordinary
 * way anyone reads a 69 KB document — got the first 64 KiB and no signal.
 *
 * **THE CAUSE IS REMOVED RATHER THAN WAITED OUT.** Setting `exitCode`
 * lets Node exit naturally once the event loop is empty, which is after
 * stdout has drained; a deferred `process.exit()` behind a drain callback
 * would be a second mechanism to keep correct. Every child process this
 * command spawns is SYNCHRONOUS (`execFileSync`/`spawnSync`) and it opens
 * no timer, socket or watcher, so there is nothing to hold the loop open.
 *
 * **THAT IS A PROPERTY WORTH STATING BECAUSE ITS FAILURE IS LOUD.** If a
 * future arm ever leaves a handle open, this command HANGS — visible,
 * attributable, and fixable — where the call it replaced would have gone
 * on silently dropping the tail. `dispatch-brief.mjs`'s rule 2 says a
 * figure may not leave this tool detached from its source; a truncation
 * detaches every figure past the cut, so the quiet failure was the one
 * this file could least afford.
 *
 * PINNED BY tests/brief-flush.spec.ts, whose oversize input is
 * SYNTHESISED: the live board crosses and re-crosses one buffer as lanes
 * open and close, so a body whose subject is the live `--dispatch` is
 * green whenever the board is small.
 *
 * **AND THE READER IS WHAT DECIDES THE LOSS, NEVER THE WRITE SHAPE**
 * (T-225, taking `T-197-s1`). The sentence above about "the ordinary way
 * anyone reads" is the load-bearing half and the buffer size is not:
 * bytes are lost if and only if they are still queued in USERLAND when
 * `process.exit()` runs, so a reader that drains promptly loses nothing
 * however the writer wrote, and a reader that pauses loses whatever it
 * has not taken however small the writes were. Measured at `5f193e6`
 * against a writer of the pre-T-197 shape emitting 524,400 bytes as 200
 * small writes: through `| cat` all 524,400 arrive, three runs of three;
 * through a reader taking 4,096 bytes every 5 ms, 65,536 arrive — one
 * pipe buffer, and 458,864 bytes gone. Since this file stopped calling
 * `process.exit()` neither reader loses anything, which is what
 * brief-flush.spec.ts's slow-reader body now drives.
 */
process.exitCode = code;
