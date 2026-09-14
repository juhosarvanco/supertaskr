#!/usr/bin/env node
/**
 * THE BRIEF COMMAND (T-133) — the runnable half of `dispatch-brief.mjs`.
 *
 * THE ONE SPELLING, run from the repo ROOT and by a dispatcher with no
 * lane. Every arm but FIVE is a read, and all five writers are NAMED
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
 * **THE FIFTH WRITER IS `--run` (T-311) AND IT IS THE SMALLEST OF THEM.**
 * It performs one operation on one child's RUN RECORD — start, bind,
 * observe, send, wait, collect, continue, stop — and writes under
 * `.supertaskr/runs/` in the checkout `--root` names, behind the same
 * self-ignoring `.gitignore` as the manifest and the holder record, so it
 * is never a commit either. It is a writer because a record is the point:
 * until T-311 nothing on disk said WHO had been started FOR WHICH
 * ATTEMPT, and a seat that lost its session had to reconstruct that from
 * worktrees. The derivation, the states and every refusal are
 * `run-record.mjs`'s; this wrapper parses the verb and renders the record.
 *
 * **THE FOURTH WRITER IS `--merge` (T-295) AND IT IS THE ARM AT THE
 * OTHER END OF THE LOOP.** Where `--dispatch-lane` performs the eight
 * hand steps that OPEN a lane, `--merge` performs the twelve that close
 * one: the fence widened on the integration branch for a verdict-named
 * spec outside it, the lane branch moved to the BENCH TIP, the merge
 * staged, the conflicts answered in the only three ways they may be
 * answered, the card stamped, each assigned correction applied off its
 * own MUTANT BLOCK, the four cheap keepers, the method stamp when
 * method text moved, the census and the graph AFTER the corrections,
 * the docs gate, the re-drill scoped to the fix diff, the counts graded
 * against the verdict's, the message written from the verdict and the
 * meters appended to the bands' readings. **It stops with the merge
 * STAGED and it never pushes**, so the seat rules and does not edit. The
 * derivation and the runner are `merge.mjs`'s; this wrapper derives the
 * dials off git and renders one line per step, which is what the seat
 * reads.
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
import { readFileSync, writeFileSync } from "node:fs";
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
  AdmissionFinding,
  AwaitFinding,
  DispatchLaneFinding,
  EXIT,
  assembleBrief,
  UnattendedFinding,
  assembleReturnBrief,
  attribute,
  awaitPlan,
  awaitRecs,
  admissionLedger,
  blank,
  normaliseTaskId,
  readDoc,
  defaultRunnerIo,
  dueRetries,
  firstParentLine,
  mergeEvidence,
  metersRecords,
  questionHolds,
  readQuestions,
  repairLedger,
  returnBriefRecs,
  roomFiles,
  sharedHealth,
  context,
  defaultAwaitIo,
  defaultDispatchIo,
  benchPlan,
  benchRecs,
  dispatchLanePlan,
  dispatchLaneRecs,
  dispatchLedgerRecs,
  dispatchPlanRecs,
  grantInheritance,
  grantState,
  liveProv,
  mainWorktree,
  note,
  render,
  runAwait,
  runBench,
  runDispatchLane,
  stateReport,
  treeProv,
  value,
  withMargin,
  triageClusterRecs,
  wakeRecs,
  EXPRESS_CODES,
  ExpressFinding,
  expressPlan,
  expressRecs,
  expressWithdrawal,
  runExpress,
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
import {
  RunRecordFinding,
  TERMINAL_STATES,
  allRecords,
  bindRun,
  collectRun,
  continueRun,
  observeRun,
  readAssignment,
  runPlan,
  runRecs,
  sendAnswer,
  startRun,
  stopRun,
  textOrFile,
  waitRun,
} from "./run-record.mjs";
import { findCheckoutRoot } from "../../../.claude/hooks/lane-fence.mjs";
// T-314 — THE ARM INSTALLS THE GUARD GIT ITSELF RUNS. Reached the way the
// line above reaches its neighbour: the installer imports node builtins and
// the hooks beside it and nothing else, so it loads in a lane worktree
// ninety seconds old exactly as `lane-fence.mjs` does.
import { hookStatus, installHook } from "../../../.claude/hooks/hook-install.mjs";
import { main as mergeMain, mergeDials } from "./merge.mjs";
import { LaneLockFinding, applyLaneLock } from "./lane-lock.mjs";
import { DECOMPOSITION_FILE, earsKeywords, isEars, seatRecs } from "./session-economics.mjs";

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
  "--allow-shared-git-config",
  "--dispatch-lane",
  "--merge",
  "--bench",
  "--await",
  "--await-pid",
  "--await-until",
  "--since",
  "--ceiling",
  "--run",
  "--assignment",
  "--attempt",
  "--session",
  "--pid",
  "--question",
  "--answer",
  "--evidence",
  "--usage",
  "--ref",
  "--report",
  "--instant",
  "--replace",
  "--bump",
  "--meters",
  "--tier",
  "--blocks-absent",
  "--derived-from",
  "--failure",
  "--express",
  "--express-withdraw",
  "--express-id",
  "--fence",
  "--changed",
  "--feature",
  "--milestone",
  "--requested",
  "--why",
  "--branch",
  "--slug",
  "--executor",
  "--verifier",
  "--scratch",
  "--dry-run",
  "--full",
  "--help",
]);

/**
 * A COMMA-SEPARATED LIST FLAG, SPLIT. Every flag here takes ONE value, so
 * a fence of several paths arrives as one string — and a list split on
 * whitespace would break on a path nobody can spell any other way. The
 * separator is the comma the card's own `touches:` uses, so what a seat
 * types at `--fence` is exactly what the card will carry.
 *
 * @param {string} raw
 * @returns {string[]}
 */
function splitList(raw) {
  return String(raw ?? "")
    .split(",")
    .map((p) => p.trim())
    .filter((p) => p !== "");
}

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
 * THE GRANT A SUCCESSOR COORDINATOR INHERITS FROM THE BLOCK (T-324's
 * sixth criterion, over T-238's seat).
 *
 * It is a function here rather than three lines inside the seat arm
 * because a body has to be able to drive it over a FIXTURE runtime
 * directory — a checkout with a holder record and a template of its own —
 * without taking a seat in the checkout the body is running in.
 *
 * @param {ReturnType<typeof context>} ctx
 * @returns {ReturnType<typeof value>[]}
 */
export function succession(ctx) {
  const state = grantState(ctx.root);
  const inherited = grantInheritance(state, admissionLedger(allRecords(ctx.root), TERMINAL_STATES));
  const p = treeProv(
    ctx.ref,
    "the runtime template's dispatch block, read through the parser library's own reader",
  );
  return [
    value(`the grant this seat inherits: ${inherited.why}`, p),
    value(
      "it continues that order, and the previous coordinator's identity is no part of what it " +
        "inherits — a seat is taken and released, and the approval is the owner's",
      p,
    ),
  ];
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
  let allowSharedGitConfig = false;
  let dryRun = false;
  let replace = false;
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
          "[--write-fence <worktree>] [--take-seat [--allow-shared-git-config]] [--release-seat] " +
          "[--dispatch-lane <T-NNN> --slug <slug> [--executor <seat>] [--verifier <seat>] " +
          "[--scratch <dir>] [--derived-from <T-NNN> --failure <text|@file>] [--dry-run]] " +
          "[--express <outcome sentence> --fence <path[,path...]> [--changed <path[,path...]>] " +
          "[--express-id <T-NNN>] [--feature <F-nn> --milestone <n>] [--requested <iso>] " +
          "[--slug <slug>] " +
          "[--scratch <dir>] [--executor <seat>] [--verifier <seat>] [--dry-run]] " +
          "[--express-withdraw <T-NNN> --why <text|@file> --tier <standard|guarded> " +
          "[--branch <b>] [--attempt <id>]] " +
          "[--merge <T-NNN> [--bump <old>..<new>] [--meters <path>] [--tier <tier>] " +
          "[--blocks-absent <sha>] [--dry-run]] [--bench <T-NNN> [--scratch <dir>]] " +
          "[[--await <marker> | --await-pid <pid> | --await-until <instant>] --ceiling <seconds>] " +
          "[--since <instant>] " +
          "[--run start --assignment <path>] " +
          "[--run bind|observe|send|wait|collect|continue|stop --attempt <id> " +
          "[--session <id>] [--pid <n>] [--question <id>] [--answer <text|@file>] " +
          "[--evidence <text|@file>] [--ceiling <seconds>] [--usage <text>] [--ref <sha>] " +
          "[--report <path>] [--instant <name>=<iso>[,...]] [--replace]] " +
          "[--full] [--root <path>]",
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
    if (a === "--allow-shared-git-config") {
      allowSharedGitConfig = true;
      continue;
    }
    if (a === "--dry-run") {
      dryRun = true;
      continue;
    }
    if (a === "--replace") {
      replace = true;
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
  const mergeId = opts["merge"] ?? "";
  const wantsMerge = mergeId !== "";
  const benchId = opts["bench"] ?? "";
  const wantsBench = benchId !== "";
  /**
   * ARM TWELVE'S DIALS (T-298). The wait is the ONE arm that BLOCKS, so
   * it is held apart from every other arm here rather than merely from
   * the writers: an invocation that both waited and derived would hold a
   * derived answer behind a fact that may never happen, and the ceiling
   * would then bound the wait while the answer bounded nothing.
   */
  const wantsAwait =
    opts["await"] !== undefined ||
    opts["await-pid"] !== undefined ||
    opts["await-until"] !== undefined;
  /**
   * ARM FOURTEEN (`--since`, T-322) — THE RETURN BRIEF. A pure read, and
   * it is held apart from the two blocking arms rather than from the
   * derivations: it answers what happened while the owner was away, and
   * an invocation that also cut a lane would be answering that question
   * about a world it had just changed.
   */
  const sinceRaw = opts["since"] ?? "";
  const wantsSince = sinceRaw !== "";
  /**
   * ARM THIRTEEN'S VERB (T-311). The run arm is held apart from every
   * other arm for the reason the wait is: it WRITES a run record, and one
   * of its verbs blocks. An invocation that both ran an operation and
   * derived a brief would decide by argument order which act this seat
   * was performing.
   */
  /**
   * ARM FIFTEEN'S VERBS (T-320) — THE EXPRESS PATH. `--express` takes an
   * outcome sentence and a fence and performs the short road through the
   * ordinary ritual; `--express-withdraw` takes the label back off a card
   * whose check failed or whose scope outgrew the sentence, and re-triages
   * it. Both WRITE in the integration checkout, so both are held to the
   * holder gate `--dispatch-lane` is held to, and neither shares an
   * invocation with another writer.
   */
  const expressOutcome = opts["express"] ?? "";
  const wantsExpress = expressOutcome !== "";
  const withdrawId = opts["express-withdraw"] ?? "";
  const wantsWithdraw = withdrawId !== "";
  const runVerb = opts["run"] ?? "";
  const wantsRun = runVerb !== "";
  if (!wantsAwait && !wantsRun && opts["ceiling"] !== undefined) {
    console.error(
      "brief: --ceiling only means something beside --await <marker>, --await-pid <pid>, " +
        "--await-until <instant> or --run wait — it is the bound on a wait, and there is no wait " +
        "here for it to bound.",
    );
    return EXIT.USAGE;
  }
  /**
   * THE RITUAL'S OWN DIALS, AND EVERY ONE OF THEM IS MEANINGLESS ALONE.
   * A `--slug` with no `--dispatch-lane` is a lane name for a lane nobody
   * asked to cut, and this command answers that with USAGE rather than
   * ignoring it — a flag silently dropped is a dispatcher believing it
   * said something it did not.
   */
  // `--derived-from` and `--failure` ARE THE DERIVED ADMISSION'S OWN
  // (T-324): a lane cut for a REPAIR names its parent authorized work and
  // the failure evidence, and it inherits that parent's authorization
  // rather than minting a grant. They are lane dials like the rest, so a
  // parent named at an invocation that cuts no lane is USAGE.
  const laneDials = ["slug", "executor", "verifier", "scratch", "derived-from", "failure"];
  // `--scratch` IS SHARED WITH THE BENCH ARM, because both write into the
  // ONE directory the lane owns (docs/CONVENTIONS.md's SCRATCH RULE): the
  // phase 1 brief the dispatch renders and the phase 2 brief the bench
  // renders are two files with the same stem, and a bench pointed at a
  // different directory could not find the attack set the dispatch's own
  // brief named.
  const strayDials = laneDials.filter((d) => opts[d] !== undefined && !(wantsBench && d === "scratch"));
  /**
   * THE MERGE ARM'S OWN DIALS, held to the same rule as the lane's: a
   * flag this command accepted and ignored is a seat believing it said
   * something it did not.
   */
  const mergeDialNames = ["bump", "meters", "tier", "blocks-absent"];
  // `--tier` IS SHARED WITH THE WITHDRAWAL (T-320): a withdrawn express
  // card is re-triaged to a standard or a guarded lane, and the tier it
  // is re-triaged to is the one thing that act cannot derive — it is the
  // seat's ruling on what the discovered scope needs.
  const strayMergeDials = mergeDialNames.filter(
    (d) => opts[d] !== undefined && !(wantsWithdraw && d === "tier"),
  );
  if (!wantsMerge && !wantsWithdraw && strayMergeDials.length > 0) {
    console.error(
      `brief: ${strayMergeDials.map((d) => `--${d}`).join(", ")} only mean something to ` +
        "--merge <T-NNN>, and nothing else on this command reads them.",
    );
    return EXIT.USAGE;
  }
  if (wantsMerge && wantsDispatchLane) {
    console.error(
      "brief: --dispatch-lane opens a lane and --merge closes one, and they are opposite ends of " +
        "the same loop. One invocation cannot do both — a command that did would decide by " +
        "argument order which end of the loop this seat was at.",
    );
    return EXIT.USAGE;
  }
  /**
   * THE EXPRESS ARM'S OWN DIALS, held to the rule the lane's and the
   * merge's are: a flag this command accepted and ignored is a seat
   * believing it said something it did not.
   */
  const expressDialNames = ["express-id", "fence", "changed", "feature", "milestone", "requested"];
  const strayExpressDials = expressDialNames.filter((d) => opts[d] !== undefined);
  if (!wantsExpress && strayExpressDials.length > 0) {
    console.error(
      `brief: ${strayExpressDials.map((d) => `--${d}`).join(", ")} only mean something to ` +
        "--express <outcome sentence>, and nothing else on this command reads them.",
    );
    return EXIT.USAGE;
  }
  const withdrawDialNames = ["why", "branch"];
  const strayWithdrawDials = withdrawDialNames.filter((d) => opts[d] !== undefined);
  if (!wantsWithdraw && strayWithdrawDials.length > 0) {
    console.error(
      `brief: ${strayWithdrawDials.map((d) => `--${d}`).join(", ")} only mean something to ` +
        "--express-withdraw <T-NNN>, and nothing else on this command reads them.",
    );
    return EXIT.USAGE;
  }
  if (wantsExpress && (opts["fence"] ?? "") === "") {
    console.error(
      "brief: --express takes an outcome sentence and a NAMED FENCE — --fence <path[,path...]>. " +
        "The bounded tier is bounded by exactly that list, and an eligibility measured over no " +
        "paths is a measurement of nothing.",
    );
    return EXIT.USAGE;
  }
  if ((wantsExpress || wantsWithdraw) && (wantsMerge || wantsDispatchLane || wantsBench || wantsRun)) {
    console.error(
      "brief: --express and --express-withdraw are WRITERS in the integration checkout, like " +
        "--dispatch-lane and --merge. One invocation cannot do two of them — a command that did " +
        "would decide by argument order which act this seat was performing.",
    );
    return EXIT.USAGE;
  }
  if (wantsExpress && wantsWithdraw) {
    console.error(
      "brief: --express puts a card on the express path and --express-withdraw takes it off. One " +
        "invocation cannot do both.",
    );
    return EXIT.USAGE;
  }
  if (wantsBench && (wantsMerge || wantsDispatchLane)) {
    console.error(
      "brief: --bench arms the VERIFICATION of a lane that is already built, and --dispatch-lane " +
        "and --merge are the two ends of the loop around it. One invocation cannot do two of the " +
        "three, for the reason the sentence above gives: argument order would decide which stage " +
        "of the loop this seat was at.",
    );
    return EXIT.USAGE;
  }
  if (!wantsDispatchLane && !wantsMerge && !wantsRun && !wantsExpress && (strayDials.length > 0 || dryRun)) {
    console.error(
      `brief: ${[...strayDials.map((d) => `--${d}`), ...(dryRun ? ["--dry-run"] : [])].join(", ")} ` +
        "only mean something to --dispatch-lane <T-NNN>, and nothing else on this command reads " +
        "them. A flag this command accepted and ignored is a dispatcher who believes it said " +
        "something it did not.",
    );
    return EXIT.USAGE;
  }
  if (wantsRun) {
    const others = [
      ...(taskId === "" ? [] : ["--task"]),
      ...(wantsState ? ["--state"] : []),
      ...(wantsDispatch ? ["--dispatch"] : []),
      ...(cardId === "" ? [] : ["--card"]),
      ...(auditPath === "" ? [] : ["--audit"]),
      ...(wantsPreflight ? ["--preflight"] : []),
      ...(fenceWorktree === "" ? [] : ["--write-fence"]),
      ...(wantsTakeSeat ? ["--take-seat"] : []),
      ...(wantsReleaseSeat ? ["--release-seat"] : []),
      ...(wantsDispatchLane ? ["--dispatch-lane"] : []),
      ...(wantsMerge ? ["--merge"] : []),
      ...(wantsBench ? ["--bench"] : []),
      ...(wantsAwait ? ["--await"] : []),
      ...(wantsSince ? ["--since"] : []),
    ];
    if (others.length > 0) {
      console.error(
        `brief: --run cannot share an invocation with ${others.join(", ")}. It performs one ` +
          "OPERATION on one child's run record — it writes, and one of its verbs blocks — so an " +
          "invocation that also derived a brief would decide by argument order which act this " +
          "seat was performing.",
      );
      return EXIT.USAGE;
    }
    /** @type {import("./run-record.mjs").RunPlan} */
    let plan;
    try {
      plan = runPlan(opts, replace);
    } catch (err) {
      if (err instanceof RunRecordFinding) {
        console.error(`brief: ${err.message}`);
        return EXIT.USAGE;
      }
      throw err;
    }
    // THE RECORDS LIVE IN THE CHECKOUT THIS ARM RUNS IN, and that is the
    // SEAT's checkout rather than the lane's: a reservation over a lane
    // worktree cannot live inside the thing it reserves, or two seats
    // would each hold their own copy of the lock.
    const runRoot = opts["root"] ?? findCheckoutRoot(process.cwd()) ?? process.cwd();
    const at = new Date().toISOString();
    const host = os.hostname();
    const rctx = { at, host, root: runRoot };
    try {
      /** @type {string[]} */
      let extra = [];
      /** @type {import("./run-record.mjs").RunRecord} */
      let record;
      let satisfied = true;
      if (plan.verb === "start") {
        const assignment = readAssignment(/** @type {string} */ (plan.assignment));
        const started = startRun(runRoot, { assignment, at, host });
        record = started.record;
        extra = [
          `written: ${started.file}`,
          started.reservation === null
            ? "reservation: none — a read-only participant runs beside the writer it serves"
            : `reservation: ${started.reservation.resource} taken atomically at ${started.reservation.takenAt}`,
          "next: spawn the child, then bind it with --run bind --attempt " +
            `${started.record.attempt} --session <the harness's id>`,
        ];
      } else if (plan.verb === "bind") {
        record = bindRun(runRoot, {
          attempt: plan.attempt,
          harnessId: /** @type {string} */ (plan.harnessId),
          ...(plan.pid === undefined ? {} : { pid: plan.pid }),
          at,
        });
      } else if (plan.verb === "observe") {
        const seen = observeRun(runRoot, {
          attempt: plan.attempt,
          ...(plan.evidence === undefined ? {} : { evidence: plan.evidence }),
          at,
        });
        record = seen.record;
        extra = seen.signals.map((s) => `signal: ${s}`);
      } else if (plan.verb === "send") {
        const sent = sendAnswer(runRoot, {
          attempt: plan.attempt,
          question: /** @type {string} */ (plan.question),
          ...(plan.answer === undefined ? {} : { answer: plan.answer }),
          ...(plan.evidence === undefined ? {} : { delivered: plan.evidence }),
          at,
        });
        record = sent.record;
        extra = [
          `written: ${String(sent.wrote)}`,
          `delivered: ${String(sent.delivered)}`,
          "acknowledged: never by this arm — it comes from the child's own file or the harness's own output",
        ];
      } else if (plan.verb === "wait") {
        const waited = await waitRun(
          runRoot,
          {
            attempt: plan.attempt,
            ceilingMs: /** @type {number} */ (plan.ceilingMs),
            ...(plan.evidence === undefined ? {} : { evidence: plan.evidence }),
          },
          {
            now: () => Date.now(),
            sleep: (ms) =>
              new Promise((resolve) => {
                setTimeout(resolve, ms);
              }),
          },
        );
        record = waited.record;
        satisfied = waited.satisfied;
        extra = [waited.ceiling ? `CEILING REACHED — ${waited.why}` : `satisfied — ${waited.why}`];
      } else if (plan.verb === "collect") {
        const got = collectRun(runRoot, {
          attempt: plan.attempt,
          ...(plan.usage === undefined ? {} : { usage: plan.usage }),
          ...(plan.ref === undefined ? {} : { ref: plan.ref }),
          ...(plan.report === undefined ? {} : { report: plan.report }),
          ...(plan.instants === undefined ? {} : { instants: plan.instants }),
          at,
        });
        record = got.record;
        extra = [
          `collected state: ${got.collected.state}`,
          `refs: ${got.collected.refs.join(", ") || "none"}`,
          `report: ${got.collected.report}`,
          `evidence entries retained: ${String(got.collected.evidence.length)}`,
        ];
      } else if (plan.verb === "continue") {
        const carried = continueRun(runRoot, {
          attempt: plan.attempt,
          ...(plan.replace === true ? { replace: true } : {}),
          ...(plan.evidence === undefined ? {} : { evidence: plan.evidence }),
          at,
          host,
        });
        record = carried.record;
        extra = [
          `reconciliation: ${carried.reconciliation.verdict} — ${carried.reconciliation.why}`,
          ...carried.reconciliation.sources.map((s) => `source: ${s}`),
          `re-delivered: ${carried.redelivered.join(", ") || "nothing was left unacknowledged"}`,
          ...(carried.replaced === null ? [] : [`replaces: ${carried.replaced}`]),
        ];
      } else {
        const stopped = stopRun(runRoot, {
          attempt: plan.attempt,
          ...(plan.evidence === undefined ? {} : { evidence: plan.evidence }),
          at,
        });
        record = stopped.record;
        extra = [
          `reconciliation: ${stopped.reconciliation.verdict} — ${stopped.reconciliation.why}`,
          ...stopped.reconciliation.sources.map((s) => `source: ${s}`),
          "the shared harness process was never signalled, and this arm holds no code path that could",
        ];
      }
      say(render(runRecs(rctx, plan.verb, record, extra)));
      flush();
      return satisfied ? EXIT.CLEAN : EXIT.FOUND;
    } catch (err) {
      // AN ADMISSION REFUSED IS A FINDING AND IT CARRIES ITS CODE
      // (T-324), by exactly the path a run-record refusal takes: the
      // admission comes BEFORE the reservation, so a refusal here has
      // written nothing and left no lock behind.
      if (err instanceof RunRecordFinding || err instanceof AdmissionFinding) {
        console.error(`brief: [${err.code}] ${err.message}`);
        return EXIT.FOUND;
      }
      throw err;
    }
  }
  if (wantsAwait) {
    const others = [
      ...(taskId === "" ? [] : ["--task"]),
      ...(wantsState ? ["--state"] : []),
      ...(wantsDispatch ? ["--dispatch"] : []),
      ...(cardId === "" ? [] : ["--card"]),
      ...(auditPath === "" ? [] : ["--audit"]),
      ...(wantsPreflight ? ["--preflight"] : []),
      ...(fenceWorktree === "" ? [] : ["--write-fence"]),
      ...(wantsTakeSeat ? ["--take-seat"] : []),
      ...(wantsReleaseSeat ? ["--release-seat"] : []),
      ...(wantsDispatchLane ? ["--dispatch-lane"] : []),
      ...(wantsMerge ? ["--merge"] : []),
      ...(wantsBench ? ["--bench"] : []),
      ...(wantsRun ? ["--run"] : []),
      ...(wantsSince ? ["--since"] : []),
    ];
    if (others.length > 0) {
      console.error(
        `brief: the wait cannot share an invocation with ${others.join(", ")}. It is the one arm ` +
          "that BLOCKS, and an answer derived beside it would sit behind a fact that may never " +
          "happen — the ceiling would bound the wait and nothing would bound the answer. Wait, " +
          "then derive.",
      );
      return EXIT.USAGE;
    }
    /** @type {import("./dispatch-brief.mjs").AwaitPlan} */
    let plan;
    try {
      plan = awaitPlan({
        ...(opts["await"] === undefined ? {} : { marker: opts["await"] }),
        ...(opts["await-pid"] === undefined ? {} : { pid: opts["await-pid"] }),
        ...(opts["await-until"] === undefined ? {} : { until: opts["await-until"] }),
        ...(opts["ceiling"] === undefined ? {} : { ceiling: opts["ceiling"] }),
      });
    } catch (err) {
      if (err instanceof AwaitFinding) {
        console.error(`brief: ${err.message}`);
        return EXIT.USAGE;
      }
      throw err;
    }
    const ctx = context({ ...(opts["root"] === undefined ? {} : { root: opts["root"] }) });
    const result = await runAwait(plan, defaultAwaitIo());
    say(render(awaitRecs(ctx, plan, result)));
    flush();
    // THE CEILING IS AN ANSWER AND IT CARRIES AN EXIT (T-298). A caller
    // that read only the exit still learns the wait ended without the
    // fact, which is the whole difference between a bounded wait and a
    // sleep that a script cannot tell from a success.
    return result.satisfied ? EXIT.CLEAN : EXIT.FOUND;
  }
  if (wantsSince) {
    const others = [
      ...(taskId === "" ? [] : ["--task"]),
      ...(wantsState ? ["--state"] : []),
      ...(wantsDispatch ? ["--dispatch"] : []),
      ...(cardId === "" ? [] : ["--card"]),
      ...(auditPath === "" ? [] : ["--audit"]),
      ...(wantsPreflight ? ["--preflight"] : []),
      ...(fenceWorktree === "" ? [] : ["--write-fence"]),
      ...(wantsTakeSeat ? ["--take-seat"] : []),
      ...(wantsReleaseSeat ? ["--release-seat"] : []),
      ...(wantsDispatchLane ? ["--dispatch-lane"] : []),
      ...(wantsMerge ? ["--merge"] : []),
      ...(wantsBench ? ["--bench"] : []),
    ];
    if (others.length > 0) {
      console.error(
        `brief: --since cannot share an invocation with ${others.join(", ")}. It answers what ` +
          "happened while the owner was away, and an invocation that also dispatched, merged or " +
          "armed a bench would be answering that question about a world it had just changed.",
      );
      return EXIT.USAGE;
    }
    if (!Number.isFinite(Date.parse(sinceRaw))) {
      console.error(
        `brief: ${JSON.stringify(sinceRaw)} is not an instant. --since takes an ISO 8601 instant ` +
          "— the moment the owner stepped away — because the whole answer is a WINDOW and a " +
          "window with a guessed edge reports a different set to every reader.",
      );
      return EXIT.USAGE;
    }
    const ctx = context({ ...(opts["root"] === undefined ? {} : { root: opts["root"] }) });
    const io = defaultRunnerIo();
    // THE RUNNER IS ASKED ONCE PER INVOCATION. Both halves below read the
    // same answer, so the brief and the attribution under it cannot be
    // describing two different histories.
    const runs = io.runs(ctx.root);
    const line = firstParentLine(ctx.root);
    const onLine = new Set(line.map((c) => c.sha));
    // THE RECORDS ARE GATHERED HERE, because this wrapper is the one
    // module that imports both halves (T-324's own split for the
    // admission ledger, one card later). One read, and both the brief and
    // the health check below spend it.
    const records = allRecords(ctx.root);
    const input = assembleReturnBrief(ctx, { since: sinceRaw, io, runs, records });
    say(render(returnBriefRecs(ctx, input)));
    // ── THE ATTRIBUTION OF EVERY RED IN THE WINDOW (T-322 criterion 1) ─
    // The brief attributes BEFORE it recommends anything, and it reads
    // the run's OWN log to do it. A red left unattributed here is a red
    // the loop would act on by guessing, which is the one move the
    // criterion forbids; and whether the attribution was RECORDED is a
    // separate line, because deriving one is not the same as filing it.
    const reds = input.merges.filter((m) => m.conclusion === "failure");
    const t = liveProv(ctx.at, ctx.host, "the runner's own runs and the failing log of each red");
    // THE ATTRIBUTIONS ARE DERIVED BEFORE ANYTHING IS RENDERED, because
    // the health check below reads them: a red that has been attributed
    // PERMITS its designated repair, and one that has not holds every
    // action — so the two answers have to come from one derivation.
    const recovery = grantState(ctx.root).recovery;
    const attributions = reds.map((m) => {
      const log = io.log(ctx.root, m.run);
      const card = /^Merge\s+(T-\d+(?:-s\d+)?)\b/.exec(m.subject);
      return {
        run: m.run,
        tested: m.tested,
        card: card === null ? m.sha.slice(0, 8) : String(card[1]),
        attribution:
          log === null
            ? null
            : attribute({
                log,
                runs: runs ?? [],
                // THE TIP IS THE SHA THE RUN TESTED AND THE INSTANT THE
                // RUN WAS CREATED, never the merge commit and never the
                // commit's own date: the baseline is the newest EARLIER
                // run, and "earlier" is a fact about runs.
                tip: { sha: m.tested, at: m.runAt },
                isAncestor: (sha) => onLine.has(sha),
                recovery,
              }),
      };
    });
    say("");
    say(
      render([
        note("THE REDS IN THIS WINDOW, ATTRIBUTED — a red is not a defect until something says"),
        note("WHICH defect. Four answers and they route four different ways: a regression becomes"),
        note("the repair, a transient failure a wait and a retry, a failure needing configuration"),
        note("or an owner's action a PARK with a wake, and an unresolved cause a diagnosis."),
        ...(reds.length === 0
          ? [value("no run in this window concluded failure", t)]
          : attributions.flatMap((row) =>
              row.attribution === null
                ? [
                    value(`${row.run} at ${row.tested} — RED, and its log could not be read from here`, t),
                    value(
                      "   so this run is NOT attributed. An attribution with no log is a guess, and " +
                        "the next act is to read the log rather than to act on this line.",
                      t,
                    ),
                  ]
                : [
                    value(
                      `${row.run} at ${row.tested} — ${row.attribution.class.toUpperCase()} → ${row.attribution.action}`,
                      t,
                    ),
                    value(`   ${row.attribution.why}`, t),
                    value(
                      `   baseline: ${row.attribution.baseline}` +
                        (row.attribution.range === "" ? "" : ` · range ${row.attribution.range}`),
                      t,
                    ),
                  ],
            )),
      ]),
    );
    // ── WHAT MAY PROCEED RIGHT NOW (T-322 criterion 3) ────────────────
    // The health check is run HERE rather than at the dispatch boundary
    // because this is the one arm that has the runner's answer: the CI
    // half of the state is a fact about a machine that is not this one,
    // and `--dispatch` cannot reach it without making its own size
    // non-deterministic (brief-flush.spec.ts compares two runs of every
    // arm). So the dispatch order reports the check with its CI half
    // honestly UNKNOWN, and this arm reports it populated. T-322-s4 is
    // the card for closing that.
    const attributedRed = attributions.find(
      (row) => row.attribution !== null && row.attribution.class === "regression",
    );
    const newest = input.merges[0];
    const health = {
      ci: {
        known: runs !== null,
        green: newest === undefined ? true : newest.conclusion === "success",
        attributed:
          attributedRed === undefined || attributedRed.attribution === null
            ? null
            : { card: attributedRed.card, bodies: attributedRed.attribution.bodies },
      },
      verification: {
        trusted: true,
        owed: false,
        why: "no bench and no seal is owed by a report; this answer proposes no stage of its own",
      },
      writers: {
        unknown: records
          .filter(
            (r) => r.writer === true && !TERMINAL_STATES.includes(r.state) && r.execution === null,
          )
          .map((r) => String(r.resource ?? r.attempt)),
      },
    };
    const pendingQuestions = input.questions.filter((q) => q.state === "pending").map((q) => q.id);
    const proposed = [
      ...input.repairs.map((r) => ({
        kind: "repair",
        card: r.card,
        repairs: r.parent,
        pendingQuestions,
        resource: null,
      })),
      ...input.lanes.map((l) => ({
        kind: "landing",
        card: l.taskId,
        checks: [],
        dependsOn: input.questions.filter((q) => q.cards.includes(l.taskId)).map((q) => q.id),
        pendingQuestions,
        resource: l.worktree,
      })),
    ];
    say("");
    say(
      render([
        note("WHAT MAY PROCEED RIGHT NOW — the shared-health check, run against each ACTION this"),
        note("brief can name rather than against the world. An attributed red permits its own"),
        note("designated repair and holds a landing it invalidates; an unknown live writer or an"),
        note("untrusted verification path holds everything, and no permission bypasses those."),
        ...(proposed.length === 0
          ? [value("this brief names no repair and no live lane, so there is no action to check", t)]
          : proposed.flatMap((action) => {
              const verdict = sharedHealth(health, action);
              return [
                value(verdict.why, t),
                ...verdict.holds.map((/** @type {string} */ h) => value(`   HELD — ${h}`, t)),
              ];
            })),
        value(
          health.ci.known
            ? `the CI half was READ from the runner: the newest merge in this window concluded ` +
              `${newest === undefined ? "nothing — the window is empty" : newest.conclusion}`
            : "the CI half is UNKNOWN — the runner could not be reached, so no rule that turns on " +
              "a red fired here, and this answer says that rather than assuming green",
          t,
        ),
      ]),
    );
    flush();
    return EXIT.CLEAN;
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
    !wantsDispatchLane &&
    !wantsMerge &&
    !wantsBench &&
    !wantsRun &&
    !wantsExpress &&
    !wantsWithdraw
  ) {
    console.error(
      "brief: nothing asked for — give --task <T-NNN> for a dispatch brief, --state for the " +
        "sections of docs/STATE.md a command can answer, --dispatch for what is startable now " +
        "and why the rest are not, --card <T-NNN> for the figures a card author would " +
        "otherwise type, --take-seat or --release-seat for the integration checkout's holder, " +
        "--dispatch-lane <T-NNN> --slug <slug> to perform the whole dispatch ritual, --bench " +
        "<T-NNN> to take the verifier's ground and render its phase 2 brief, --express " +
        "<outcome sentence> --fence <path[,path...]> for the express path inside the bounded " +
        "tier, --express-withdraw <T-NNN> to take that label back off a card, " +
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
  const arming =
    wantsPreflight || fenceWorktree !== "" || wantsDispatchLane || wantsMerge || wantsExpress || wantsWithdraw;
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
  const ownershipIdentity =
    wantsTakeSeat || wantsReleaseSeat ? sessionIdentity() : undefined;
  const holder =
    arming || wantsTakeSeat || wantsReleaseSeat
      ? holderVerdict({
          root: ctx.root,
          ...(ownershipIdentity === undefined ? {} : { identity: ownershipIdentity }),
        })
      : undefined;
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
   * Both commands first derive the acting session. `--take-seat` then
   * refuses a checkout somebody else is live in, takes over a DEAD
   * holder's record while ANNOUNCING whose it was, and writes otherwise.
   * `--release-seat` gives it up only after the same identity precondition,
   * and refuses to remove a live record it cannot show belongs to this
   * session — removing another seat's declaration is the one harm this
   * arm could do.
   *
   * **AND IT REFUSES AN UNREADABLE RECORD TOO** (T-238-s1). That is the
   * same harm reached by a different route: a record whose SHAPE this
   * reader cannot parse says nothing about whose it is, so removing it
   * retires an unread claim — and the arm used to do exactly that and
   * print RELEASED. Both commands now preserve it for inspection.
   *
   * THE ONE EARLY RETURN IS AN INABILITY. A session whose own identity
   * cannot be derived cannot create OR retire a claim on its own behalf,
   * and that is `COULD NOT RUN` rather than a finding about the checkout:
   * the house contract keeps "I derived it and found something" apart
   * from "I could not tell you", and this is squarely the second.
   */
  if (wantsTakeSeat || wantsReleaseSeat) {
    const h = /** @type {NonNullable<typeof holder>} */ (holder);
    const asked = wantsTakeSeat ? "--take-seat" : "--release-seat";
    say("");
    // ── IS THIS CHECKOUT GUARDED AT ALL? (T-314) ────────────────────
    // BOTH VERBS SAY IT AND BOTH SAY IT BEFORE THEY ACT. A `PreToolUse`
    // hook is one harness's; the guard git itself runs is every
    // harness's, and a checkout where `core.hooksPath` was never pointed
    // at the tracked hooks directory runs NEITHER when the session is
    // not Claude's. The seat is the one moment a session declares it is
    // acting in an integration checkout, so it is the one moment this
    // is worth a line — and it is a line whether the answer is good or
    // bad, because "UNGUARDED" is only legible beside the other answer.
    const guardBefore = hookStatus(ctx.root);
    say(
      render([
        note("THE PUSH GUARD GIT ITSELF RUNS — the pre-push hook, which every harness runs and"),
        note("none can be told to skip by being a different harness"),
        value(
          guardBefore.detail,
          liveProv(ctx.at, ctx.host, "core.hooksPath and the hook file, read in the checkout --root names"),
        ),
      ]),
    );
    say("");
    if (h.state !== "not-integration" && ownershipIdentity !== undefined && !ownershipIdentity.ok) {
      console.error("brief: COULD NOT RUN");
      console.error(`  ${ownershipIdentity.why}`);
      console.error(
        "  Nothing was changed. A session that cannot name itself cannot create or retire a " +
          "claim on its own behalf.",
      );
      flush();
      return EXIT.CANNOT_RUN;
    } else if (h.state === "not-integration") {
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
    } else if (wantsTakeSeat && h.code !== HOLDER_CODES.UNREADABLE) {
      const mine = /** @type {Extract<ReturnType<typeof sessionIdentity>, {ok: true}>} */ (
        ownershipIdentity
      );
      // ── THE GUARD IS INSTALLED BEFORE THE SEAT IS RECORDED (T-314) ─
      // THE ORDER IS THE AMENDMENT'S AND IT IS THE WHOLE OF IT: a
      // refusal here leaves the holder record, the git configuration and
      // the index exactly as they were. A session that recorded a seat
      // on the strength of a guard that was never installed is a
      // checkout believed guarded by everything downstream that reads
      // that record — which is worse than one that is plainly unguarded.
      const installed = installHook({
        root: ctx.root,
        authorizeSharedConfig: allowSharedGitConfig,
      });
      // AN ABSENT HOOK FILE IS NOT A REFUSAL, it is the UNGUARDED
      // report this card's third criterion asks the seat verbs for: a
      // checkout older than the hook has nothing to install, and a seat
      // that could not be taken there is a seat nobody could use to
      // update it.
      if (installed.state === "refused") {
        say(
          render([
            note("THE SEAT — NOT TAKEN, because the pre-push guard could not be installed and a"),
            note("seat recorded over an uninstalled guard is a checkout everything downstream"),
            note("believes is guarded. Nothing was written: no hooks path, no holder record."),
            value(
              `${asked} refused: ${installed.detail}`,
              liveProv(ctx.at, ctx.host, "git config, and the hooks directories it names"),
            ),
            value(
              "an authorized shared-configuration change is asked for explicitly: --allow-shared-git-config",
              liveProv(ctx.at, ctx.host, "this command's own flag set"),
            ),
          ]),
        );
        holderFindings.push(
          `${asked} took no seat because the pre-push guard could not be installed — ${installed.detail}`,
        );
      } else {
      const written = writeHolder(ctx.root, mine.identity, { at: ctx.at, host: ctx.host });
      const guardAfter = hookStatus(ctx.root);
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
            `the pre-push guard: ${installed.state} [${installed.code}]` +
              (installed.scope === undefined ? "" : ` at ${installed.scope} scope`) +
              (installed.modeSet === true ? ", and its executable mode was set" : ""),
            liveProv(ctx.at, ctx.host, "git config, written in the checkout --root names"),
          ),
          value(
            guardAfter.detail,
            liveProv(ctx.at, ctx.host, "core.hooksPath and the hook file, re-read after the install"),
          ),
          value(
            "release it when you retire: node tools/e2e/scripts/brief.mjs --release-seat",
            liveProv(ctx.at, ctx.host, "this command's own spelling, from docs/CONVENTIONS.md"),
          ),
          // ── WHAT THE SUCCESSOR INHERITS (T-324, over T-238's seat) ──
          // **THE GRANT IS THE BLOCK'S AND NEVER THE PREDECESSOR'S.** A
          // seat is taken and released; the owner's approval lives in the
          // runtime template, so a successor coordinator reads the same
          // revision, the same order and the same blobs, continues the
          // order from where the records say it stands, and inherits none
          // of the previous coordinator's identity. Before this card the
          // only thing there was to inherit was a checkpoint's prose.
          ...succession(ctx),
        ]),
      );
      }
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
      // T-303-s1 closes the acquisition half too: `wantsTakeSeat`
      // excludes this code above, so both ownership commands reach this
      // refusal and preserve the unread claim for inspection.
      say(
        render([
          note("THE SEAT — NOT CHANGED. The record on disk is a SHAPE this reader cannot read,"),
          note("so who holds this checkout was never established; replacing or removing it would"),
          note("retire an unread claim and destroy the only evidence of whose it was."),
          value(
            `${asked} refused: ${h.detail}`,
            liveProv(ctx.at, ctx.host, `${HOLDER_REL_PATH}, as it is on disk`),
          ),
        ]),
      );
      holderFindings.push(
        `${asked} refused an unreadable ${HOLDER_REL_PATH} without replacing or removing it — ` +
          `${h.detail} Inspect the record, then repair or delete it only after establishing that ` +
          "its claim is retired.",
      );
    } else if (h.state === "unknown" && h.figures["holderAlive"] === true) {
      // UNREACHABLE TODAY, AND KEPT ON PURPOSE. This state is
      // `HOLDER_CODES.UNDERIVABLE`, which `holderVerdict` returns only
      // when the identity it was handed is not ok — and the precondition
      // at the top of this block has already returned CANNOT_RUN for
      // exactly that. It stays because it is the branch that catches a
      // live record if that precondition is ever relaxed, and a reader
      // who meets it should know no body reaches it rather than assume
      // one does.
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
        // THE LEDGER IS DERIVED HERE AND HANDED IN (T-324). The plan is
        // pure and the records are `run-record.mjs`'s, so this command —
        // the one file that imports both halves — is where the two meet;
        // a `dispatch-brief.mjs` that imported the run record would be a
        // cycle, since the run record already imports it.
        const plan = dispatchLanePlan(ctx, {
          taskId: laneId,
          slug: /** @type {string} */ (opts["slug"]),
          ledger: admissionLedger(allRecords(ctx.root), TERMINAL_STATES),
          ...(opts["executor"] === undefined ? {} : { executor: opts["executor"] }),
          ...(opts["verifier"] === undefined ? {} : { verifier: opts["verifier"] }),
          ...(opts["scratch"] === undefined ? {} : { scratch: opts["scratch"] }),
          ...(opts["derived-from"] === undefined ? {} : { derivedFrom: opts["derived-from"] }),
          ...(opts["failure"] === undefined ? {} : { failure: textOrFile(opts["failure"]) }),
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

  /**
   * ARM FIFTEEN — THE EXPRESS PATH (T-320), and it is a short road
   * through the ordinary one rather than a second road.
   *
   * IT WRITES IN THE INTEGRATION CHECKOUT — one compact card, staged so
   * that the dispatch stamp commits it and the stamp in ONE commit — so
   * it takes the SAME holder gate `--dispatch-lane` takes. The EARS
   * reading it needs is handed IN from here, because the module that owns
   * the patterns (`session-economics.mjs`) imports the module that owns
   * the arm and the dependency may not run both ways; and so is the
   * admission LEDGER, for T-324's own reason.
   *
   * @type {string[]}
   */
  const expressFindings = [];
  if (wantsExpress || wantsWithdraw) {
    const h = /** @type {NonNullable<typeof holder>} */ (holder);
    say("");
    if (h.state === "not-integration" || h.state === "held") {
      say(
        render([
          note("THE EXPRESS PATH — REFUSED before its first step, and nothing was written"),
          value(
            `--${wantsExpress ? "express" : "express-withdraw"} was refused: ${h.detail}`,
            liveProv(ctx.at, ctx.host, "git symbolic-ref HEAD and the holder record, read in that checkout"),
          ),
        ]),
      );
      expressFindings.push(
        `the express path writes a card into the integration checkout and re-triages one there, ` +
          `so it is held to the same gate the dispatch is — ${h.detail}`,
      );
    } else if (wantsWithdraw) {
      try {
        const id = normaliseTaskId(withdrawId);
        const card = ctx.cards.get(id);
        if (card === undefined) {
          throw new ExpressFinding(
            EXPRESS_CODES.NO_CARD,
            `brief: no live card declares id ${id}, so there is no express label to withdraw.`,
          );
        }
        const at = path.join(ctx.root, card.file);
        const written = expressWithdrawal({
          cardText: readFileSync(at, "utf8"),
          id,
          at: ctx.at.slice(0, 10),
          why: opts["why"] === undefined ? "" : textOrFile(opts["why"]),
          branch: opts["branch"] ?? `the lane's own branch (none was named with --branch)`,
          attempt: opts["attempt"] ?? "",
          tier: opts["tier"] ?? "",
        });
        if (!dryRun) writeFileSync(at, written.text);
        say(
          render([
            note("THE EXPRESS LABEL, WITHDRAWN — and NOTHING was deleted or unwound"),
            value(`card: ${card.file}${dryRun ? " (--dry-run: nothing was written)" : ""}`, liveProv(ctx.at, ctx.host, "the withdrawal, over the card it wrote")),
            value(`re-triaged to: tier ${written.tier}`, liveProv(ctx.at, ctx.host, "the withdrawal, over the card it wrote")),
            ...written.preserved.map((line) =>
              value(line, liveProv(ctx.at, ctx.host, "the withdrawal's own preservation rule")),
            ),
            // THE LINE GOES OUT AS A STAMPED VALUE AND FLATTENED. It
            // carries dates and an attempt id, and this renderer refuses a
            // NOTE that carries a digit; it is also hard-wrapped for the
            // card, and a value is one line.
            value(
              `the line appended: ${written.line.replace(/\s+/g, " ")}`,
              liveProv(ctx.at, ctx.host, "the withdrawal, over the card it wrote"),
            ),
          ]),
        );
      } catch (err) {
        if (err instanceof DispatchLaneFinding) {
          expressFindings.push(err.message);
        } else throw err;
      }
    } else {
      try {
        const keywords = earsKeywords(readDoc(DECOMPOSITION_FILE, ctx.root));
        const records = allRecords(ctx.root);
        const plan = expressPlan(ctx, {
          outcome: expressOutcome,
          fence: splitList(opts["fence"] ?? ""),
          ears: (criterion) => isEars(criterion, keywords),
          suggestedBy: `the express path on ${ctx.at.slice(0, 10)}, from one outcome sentence and a named fence`,
          ledger: admissionLedger(records, TERMINAL_STATES),
          writers: records.map((rec) => ({
            attempt: rec.attempt,
            card: rec.assignment.id,
            state: rec.state,
            terminal: TERMINAL_STATES.includes(rec.state),
          })),
          ...(opts["changed"] === undefined ? {} : { changed: splitList(opts["changed"]) }),
          ...(opts["express-id"] === undefined ? {} : { id: opts["express-id"] }),
          ...(opts["feature"] === undefined ? {} : { feature: opts["feature"] }),
          ...(opts["milestone"] === undefined ? {} : { milestone: opts["milestone"] }),
          ...(opts["requested"] === undefined ? {} : { requestedAt: opts["requested"] }),
          ...(opts["slug"] === undefined ? {} : { slug: opts["slug"] }),
          ...(opts["scratch"] === undefined ? {} : { scratch: opts["scratch"] }),
          ...(opts["executor"] === undefined ? {} : { executor: opts["executor"] }),
          ...(opts["verifier"] === undefined ? {} : { verifier: opts["verifier"] }),
          ...(opts["derived-from"] === undefined ? {} : { derivedFrom: opts["derived-from"] }),
          ...(opts["failure"] === undefined ? {} : { failure: textOrFile(opts["failure"]) }),
        });
        if (dryRun) {
          say(render(expressRecs(ctx, plan, null)));
          // THE COMPOSED CARD GOES OUT LINE BY LINE AS STAMPED VALUES, not
          // verbatim. It is card text rather than this command's answer,
          // but it leaves on this command's stdout, and the provenance
          // floor (`unstampedLines`; the margin guard in
          // brief-flush.spec.ts holds every live arm to it) reads a line
          // with no stamp as a cut mid-line. The verbatim print was green
          // in every lane and bench battery, because the holder gate above
          // refuses this arm in any checkout that is not the integration
          // one before it composes — the integration checkout at the merge
          // was the first place these lines were ever printed (T-320-s9).
          const composed = liveProv(
            ctx.at,
            ctx.host,
            "the compact card, composed by this arm and written nowhere (--dry-run)",
          );
          say(
            render([
              note("--dry-run: the compact card below was composed and NOTHING was written"),
              blank(),
              ...plan.card.text
                .trimEnd()
                .split("\n")
                .map((line) => (line.trim() === "" ? blank() : value(line, composed))),
            ]),
          );
        } else {
          const result = runExpress(plan, defaultDispatchIo());
          say(render(expressRecs(ctx, plan, result)));
          for (const n of result.notes) {
            say(render([value(n, liveProv(ctx.at, ctx.host, "the express arm's own steps"))]));
          }
          if (result.transcript.length > 0) {
            // THE ORDINARY RITUAL'S OWN ANSWER, VERBATIM. Every line of it
            // already carries that command's provenance stamp, so it goes
            // out as a transcript rather than through this arm's renderer,
            // which would append a second arrow to a line that had one.
            say("");
            say("# THE ORDINARY LANE RITUAL'S OWN LEDGER, VERBATIM — this arm ran it and did not rewrite it");
            for (const line of result.transcript) say(line);
          }
          for (const f of result.findings) expressFindings.push(f);
          if (result.code === EXIT.CANNOT_RUN) {
            console.error("brief: COULD NOT RUN");
            for (const f of result.findings) console.error(`  ${f}`);
            flush();
            return EXIT.CANNOT_RUN;
          }
        }
      } catch (err) {
        if (err instanceof DispatchLaneFinding) {
          expressFindings.push(err.message);
        } else throw err;
      }
    }
  }

  /**
   * ARM ELEVEN — THE BENCH (T-296), the ritual BETWEEN the two ends.
   *
   * `--dispatch-lane` renders phase 1 from the card at the base; this arm
   * renders phase 2 at the stamp: it takes the ground by a script at the
   * base, seals the three inputs by sha256, renders the brief from the
   * card, the tier, the tip and those digests, and prints the one line
   * the seat pastes. An arm cannot spawn a seat, which is why the last
   * thing it does is hand over a line rather than a session.
   *
   * IT TAKES NO SEAT REFUSAL OF ITS OWN, and that is a difference worth
   * stating: it writes into the lane's scratch directory and reads two
   * worktrees, and it commits nothing anywhere. The two arms around it
   * refuse a checkout that is not the integration one because they STAMP
   * on the integration branch; this one has nothing to stamp.
   *
   * @type {string[]}
   */
  const benchFindings = [];
  if (wantsBench) {
    say("");
    try {
      const plan = benchPlan(ctx, {
        taskId: benchId,
        ...(opts["scratch"] === undefined ? {} : { scratch: opts["scratch"] }),
      });
      const result = runBench(plan, defaultDispatchIo());
      say(render(benchRecs(ctx, plan, result)));
      // A NOTE MAY CARRY NO DIGIT (this module's own provenance floor),
      // and every one of these carries a path — so they go out as
      // STAMPED values, which is what that floor is asking for.
      const said = liveProv(ctx.at, ctx.host, "the bench ritual's own steps, in the order runBench performs them");
      for (const n of result.notes) say(render([value(n, said)]));
      for (const f of result.findings) benchFindings.push(f);
      if (result.code === EXIT.CANNOT_RUN) {
        console.error("brief: COULD NOT RUN");
        for (const f of result.findings) console.error(`  ${f}`);
        flush();
        return EXIT.CANNOT_RUN;
      }
    } catch (err) {
      if (err instanceof DispatchLaneFinding) {
        benchFindings.push(err.message);
      } else throw err;
    }
  }

  /**
   * ARM TEN — THE MERGE (T-295), the ritual at the CLOSING end of the loop.
   *
   * The two refusals ahead of its first step are the dispatch arm's, for
   * the same reason: a merge is an act IN the integration checkout, and a
   * checkout another live session holds is `method/lane-protocol.md`
   * rule 4's collision at the one moment it is cheap to refuse.
   *
   * EVERY DIAL IS DERIVED. The lane branch off `git for-each-ref`, the
   * lane WORKTREE off `git worktree list` and never off a document's
   * bullet, the BENCH TIP off the detached bench worktree beside it, and
   * the two seats off the card's own fields. The seat types one card id.
   *
   * @type {string[]}
   */
  const mergeFindings = [];
  if (wantsMerge) {
    const h = /** @type {NonNullable<typeof holder>} */ (holder);
    say("");
    if (h.state === "not-integration") {
      say(
        render([
          note("THE MERGE — REFUSED before its first step, and nothing was written"),
          value(
            `--merge was asked of ${ctx.root}, which is not the integration checkout`,
            liveProv(ctx.at, ctx.host, "git symbolic-ref HEAD, read in that checkout"),
          ),
        ]),
      );
      mergeFindings.push(
        `--merge was asked of a checkout that is not the integration one — ${h.detail} A lane ` +
          "merges nothing (method/lane-protocol.md rule 6): it reports ready-to-merge and leaves " +
          "its worktree standing for the holder.",
      );
    } else if (h.state === "held") {
      say(
        render([
          note("THE MERGE — REFUSED, and the sentence above says by whom"),
          value(
            `--merge was refused: another live session holds ${ctx.root}`,
            liveProv(ctx.at, ctx.host, `${HOLDER_REL_PATH}, and the process table`),
          ),
        ]),
      );
    } else {
      const dials = mergeDials({ root: ctx.root, id: mergeId });
      if ("problem" in dials) {
        say(
          render([
            note("THE MERGE — the dials could not be derived, so no step ran"),
            value(dials.problem, liveProv(ctx.at, ctx.host, "git, read in the integration checkout")),
          ]),
        );
        mergeFindings.push(`--merge ${mergeId}: ${dials.problem}`);
      } else {
        say(
          render([
            note("THE MERGE — every dial DERIVED, and the seat typed one card id"),
            ...dials.how.map((line) =>
              value(line, liveProv(ctx.at, ctx.host, "git's own administration, in this checkout")),
            ),
          ]),
        );
        /** @type {{ id: string, title: string, exit: number }[]} */
        const ledger = [];
        /** @type {string[]} */
        const transcript = [];
        const code = mergeMain(
          [
            mergeId,
            "--slug",
            dials.slug,
            "--verdict",
            dials.benchTip,
            "--root",
            ctx.root,
            ...(dryRun ? ["--dry-run"] : ["--built-by", dials.builtBy, "--verified-by", dials.verifiedBy]),
            ...(opts["bump"] === undefined ? [] : ["--bump", opts["bump"]]),
            ...(opts["meters"] === undefined ? [] : ["--meters", opts["meters"]]),
            ...(opts["tier"] === undefined ? [] : ["--tier", opts["tier"]]),
            ...(opts["blocks-absent"] === undefined ? [] : ["--blocks-absent", opts["blocks-absent"]]),
          ],
          {
            cwd: ctx.root,
            ledger,
            out: (s) => transcript.push(s),
            err: (s) => transcript.push(s),
          },
        );
        // THE WHOLE TRANSCRIPT FIRST, THEN THE ONE LINE PER STEP. The
        // transcript is what a seat reads when a step refuses; the
        // ledger is what it reads when nothing did, and the card asks
        // for the second without giving up the first.
        for (const line of transcript) say(line);
        say("");
        say(
          render([
            note("THE SEAT'S RETURN — one line per step, in the order they ran"),
            ...ledger.map((s) =>
              value(
                `${s.id} exit ${String(s.exit)}`,
                liveProv(ctx.at, ctx.host, "the step's own exit, recorded as it ran"),
              ),
            ),
            ...(code === EXIT.CLEAN
              ? [
                  note("THE MERGE IS STAGED AND NOT COMMITTED, and this command NEVER PUSHES."),
                  note("The commit, the checkpoint and the push are the seat's — it rules, it"),
                  note("does not edit."),
                ]
              : [
                  note("THE RUN STOPPED. The step above with a non-zero exit says where, and the"),
                  note("transcript says why. The tree is left as it stands for the seat to rule."),
                ]),
          ]),
        );
        if (code !== EXIT.CLEAN) {
          mergeFindings.push(
            `--merge ${mergeId} stopped at ${ledger.at(-1)?.id ?? "its first step"} — the merge is ` +
              "left for the seat to rule and nothing was committed or pushed.",
          );
        }
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
    ...expressFindings,
    ...benchFindings,
    ...mergeFindings,
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
