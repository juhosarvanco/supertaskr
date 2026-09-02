/**
 * THE PUSH ASKS THE GRAPH MECHANICALLY (T-167-s8) — the decision half.
 *
 * docs/STATE.md's graph line ends *"ask AGAIN after every write"*. One
 * seat broke that three times in one day, in the same sequence each time:
 * regen, then another edit to an indexed file, then push without
 * re-asking. A fourth instance is on this card's own Verdicts section.
 * The rule held in retrospect every time and at the moment never once —
 * so it stops being a rule a hand keeps and becomes a property of the
 * push.
 *
 * ── WHAT IT ASKS, AND WHAT IT REFUSES TO ASK ─────────────────────────
 * It asks `index --check` and reads its EXIT CODE. It computes no
 * staleness of its own, and that prohibition was added at this card's
 * promotion for a named reason: a second implementation of the currency
 * question is T-057's shape, and a guard that disagreed with the gate
 * would be worse than no guard because it would teach the seat to
 * override it. So every verdict below that says STALE says it because
 * the check said 1, and the refusal QUOTES the check's own report rather
 * than paraphrasing it — including the check's own `regenerate:` line,
 * which `check.rs`'s `render` emits and this file therefore never
 * spells.
 *
 * ── THE FOUR CODES ARE THE PROJECT'S, NOT THIS FILE'S ────────────────
 * docs/CONVENTIONS.md's Rust bullet legends them for this command in as
 * many words — 0 current, 1 STALE, 2 usage, 3 the gate could not run —
 * and `CHECK_EXIT` below is COMPARED against that bullet by
 * `push-guard.spec.ts` rather than trusted. ONLY 1 REFUSES. Collapsing
 * 3 into 1 would refuse every push made without a toolchain, which is
 * this card's third acceptance criterion and the reason the codes are
 * read individually instead of as "non-zero".
 *
 * ── IT FAILS OPEN ON INABILITY, AND THAT IS THE DESIGN ───────────────
 * A guard that cannot run says so and stands aside — the lane-fence
 * hook's lane-less shape, for the same reason. The seat that pushes is
 * the seat that dispatches, merges and checkpoints; a guard that can
 * halt it on its own inability halts the project, and the first person
 * it inconveniences turns it off. So: no cargo, no toolchain, an
 * unreadable request, a checkout that is not this repository's, a check
 * that exits 2 or 3 or does not start at all — every one of those is an
 * ALLOW with the reason stated. The only GRAPH refusal is a check that
 * ran and answered 1.
 *
 * ── THREE ARMS, AND THE THIRD ONE FAILS CLOSED (T-203) ───────────────
 * This file began as one guard and now carries three. The paragraph above
 * is the GRAPH arm's rule and stays the rule for two of the three:
 *
 *   THE GRAPH (T-167-s8) — `index --check` said 1. Fails open otherwise.
 *   THE LANDING GATE (T-212) — a path outside the card's fence. Its
 *     cannot-compare is a NOTICE, never a verdict.
 *   THE PUSH BATTERY (T-203) — the CHEAP CHECKS, which fail open when
 *     they cannot run, and the VERDICT TOKEN, WHICH DOES NOT.
 *
 * A MISSING TOKEN REFUSES, and the asymmetry is this card's first
 * criterion rather than drift. Every other arm allows when it cannot
 * ANSWER a question; an absent token is not an unanswered question, it is
 * the answer — nothing was measured — and it is exactly the state this
 * guard exists to catch. A guard that allowed there would pass its own
 * subject. The remedy is one command, the refusal prints it, and the cost
 * is real: the full battery is paid once per PUSH, which is this card's
 * whole design (commits stay fast; pushes become unlyable).
 *
 * ── AND ALL THREE ARMS ASK ABOUT THE TREE THE PUSH CARRIES (T-216) ───
 * Every arm above is a question, and until this card each of them was
 * asked in `findCheckoutRoot(request.cwd)` — WHERE THE WRITER SITS. In
 * this project's dispatch shape that is the DISPATCHING checkout for
 * every lane, so `cd <lane> && git push` had its graph, its board, its
 * fence and its T-203 token all judged in a tree the push does not
 * contain. Not unjudged: MISJUDGED, in both directions, and confidently.
 *
 * `pushCwds` below replaces the assumption with EVIDENCE — git's own
 * `-C`, a `cd <literal>` chained to the push with `&&`, or a working
 * directory nothing moved — and where the line offers none, the guard
 * judges NOTHING and says so as `push-repository-unresolved`. THE COST
 * IS STATED RATHER THAN DISCOVERED: a push spelled outside those two
 * constructs is now UNJUDGED where it used to be MISJUDGED, and the
 * refusal names the spelling that restores it. That is a trade of a
 * wrong answer for no answer, which is the only direction this guard is
 * allowed to fail — and it is the same trade the section below makes.
 *
 * THE COST HAS A SECOND HALF, and an early draft of this card claimed
 * only the first. CROSS-CHECKOUT, nothing is lost: the retired verdict
 * was about a tree the push does not carry. SAME-CHECKOUT BUT
 * UNRESOLVABLE, a CORRECT verdict is retired — the writer's cwd really
 * was the answer, and the old rooting was accidentally right. Measured
 * at 7 of 7 spellings on one fixture; the table is on the card. It is
 * taken deliberately, because keeping those seven means GUESSING that an
 * unreadable line did not move the cwd, and nothing distinguishes
 * *"unreadable and it stayed"* from *"unreadable and it left"* — that is
 * what unreadable means.
 *
 * ── AND IT WIDENS THIS FILE'S THREAT MODEL, WHICH IS SAID OUT LOUD ───
 * `runCheck` spawns `cargo` with its cwd inside the judged root. Until
 * this card that root came only from the HARNESS (`request.cwd`); it can
 * now come from the COMMAND TEXT — a `-C` or a `cd` the seat typed — so
 * a Bash command can steer where this hook starts a build tool. The
 * bound is `INDEX_CRATE_MANIFEST_REL_PATH`, checked BEFORE the spawn:
 * the directory must carry this repository's own indexer crate manifest,
 * and `cargo` itself is still resolved off PATH rather than out of that
 * tree. THE RESIDUAL IS NAMED RATHER THAN DISMISSED: a directory that
 * satisfies that check still supplies the `Cargo.toml`, the workspace
 * and the `.cargo/config.toml` the spawned cargo reads, and those can
 * influence what a build runs. It is NOT a privilege escalation — a seat
 * that can write `cd <x> && git push` can run anything in `<x>` directly,
 * with the same rights and without this hook — but it is a wider surface
 * than a guard rooted on the harness had, and whoever next decides what
 * may root this file should meet that fact here.
 *
 * ── A CHECKOUT WITH NO TOOLCHAIN CANNOT PUSH, AND THAT IS DECIDED ────
 * Written down because it is a consequence nobody would predict from the
 * arms above, and because THIS FILE ARGUES THE OPPOSITE TWELVE LINES UP.
 * The graph arm reads `index --check`'s codes individually precisely so
 * that "the gate could not run" never becomes a refusal — collapsing 3
 * into 1 *"would refuse every push made without a toolchain"*. The token
 * arm now does refuse such a push by another route: with no `cargo`,
 * `gate-run.mjs` records `rust` REFUSED, and a token carrying an ungraded
 * suite is refused.
 *
 * THE DISCRIMINATOR IS WHOSE INABILITY IT IS. The graph arm refuses to
 * turn ITS OWN inability into a verdict about the tree — that would be
 * this guard asserting something it never measured. The token arm reports
 * the RUNNER's inability faithfully: the suite was not graded, so the
 * tree is not certified. One is a guard inventing evidence; the other is
 * a guard declining to invent it. A push from a toolchain-less checkout
 * IS a push nothing measured, which is the state this card exists to
 * stop, so it is refused — as `token-unmeasured`, in those words, and
 * never as `token-red`. Telling a seat its suite failed when the runner
 * declined to grade it is telling it something false about its own tree.
 *
 * ── NO ESCAPE HATCH, AND THE ARGUMENT IS ON THE CARD ─────────────────
 * This card asked for an escape spelling *"for the rare intentional push
 * of a stale graph (should not exist; argue it if found)"*, and none is
 * shipped. The one candidate case found is a WORKING TREE whose
 * uncommitted edits make the check STALE for a push whose COMMITS are
 * current — and that is a SCOPE MISMATCH rather than an intentional
 * stale push, with a one-command remedy the refusal names for you. A
 * hatch for a case that already has a remedy is a hatch that gets used
 * for every other case. `dirtyTree` below exists to word that refusal
 * and reaches no verdict: the verdict is the check's exit code and
 * nothing in this file can move it.
 *
 * ── AND A FOURTH ARM ASKS THE ONE MACHINE THAT IS NOT THIS ONE (T-237)
 * docs/CONVENTIONS.md keeps two rules by memory — *"A PUSH CANCELS THE
 * RUNNING CI JOB … BATCH THE PUSH"* and *"AND THEN READ IT"* — and on
 * 2026-09-01 both were kept in retrospect and never at the moment: four
 * runs were superseded by rapid pushes and main sat RED for roughly five
 * hours while a seat reported four green suites. Both halves of that are
 * true. **A LOCAL BATTERY AND CI ARE DIFFERENT MEASUREMENTS AND ONLY ONE
 * OF THEM RUNS ON A MACHINE THAT IS NOT YOURS**, so the T-203 token above
 * cannot answer either question, however green it is.
 *
 * So this arm asks `gh` two things about the branch the pushed checkout
 * is on, and each answer has a DIFFERENT shape on purpose:
 *
 *   IS A RUN STILL RUNNING? — a REFUSAL. Pushing now cancels it and the
 *     tree it was measuring never gets a verdict, which is how a red main
 *     is found two pushes late. The refusal names the run, its elapsed
 *     time and `gh run watch`.
 *   WHAT DID CI LAST ACTUALLY SAY? — an ANNOUNCEMENT, never a refusal.
 *     Pushing over a red is the ORDINARY way a red gets fixed, so a
 *     refusal here would block the remedy. It names the run, the failing
 *     step, and whether the tree being pushed changes anything under that
 *     step's own package — so a seat pushing a fix sees that it is
 *     pushing a fix, and a seat pushing something else sees that main is
 *     red under it. **THE QUESTION IS NOT "THE NEWEST COMPLETED RUN"**,
 *     which under this repository's `cancel-in-progress: true` is usually
 *     a run that was superseded and concluded `cancelled`; it is the
 *     newest run that reached a VERDICT, and the count of cancellations
 *     skipped on the way to it is itself the batching rule's footprint.
 *
 * ── THE ARM IS THE HEADER'S OWN RULE, PLUS ONE NAMED EXCEPTION ───────
 * `gh` absent, offline, unauthenticated or simply refusing is THIS
 * GUARD'S OWN INABILITY, and the section above spends a paragraph on why
 * an inability may not become a verdict: it ANNOUNCES that CI was not
 * asked and ALLOWS, because a guard that refuses every offline push is a
 * guard somebody turns off. **The exception is a `gh` that ANSWERED with
 * a shape this guard cannot read**, which refuses (`ci-unreadable`).
 * That is the token arm's discriminator, not a new one: an unreadable
 * answer is not an unanswered question, it is an answer this guard would
 * have to GUESS at — and the guess that matters here is *"probably no run
 * is in flight"*, which is exactly the state the arm exists to catch. The
 * split is drawn per FIELD rather than per response, and it is THREE
 * fields wide: `status` decides the refusal, `conclusion` decides the
 * announcement, `databaseId` is what an acknowledgement is checked
 * against — those are required and their absence refuses. Everything
 * else (`headSha`, `startedAt`, `createdAt`, `url`, `displayTitle`)
 * carries a SENTENCE, so its absence costs a phrase and never a verdict.
 * **`conclusion` IS THE EMPTY STRING ON A RUNNING RUN**, so `required`
 * means present-and-a-string and never present-and-non-empty; the
 * stricter test would refuse every live run, which is the one state this
 * arm exists to catch.
 *
 * ── THE ACKNOWLEDGEMENT NAMES THE RUN, AND THAT IS THE WHOLE DESIGN ──
 * `NPUTER_CANCEL_CI=<run id>` — as an environment prefix on the push's
 * own segment, or in this hook's own environment — lets a seat cancel a
 * run KNOWINGLY. It is not an override flag and this file's standing
 * refusal of those is intact: an override flag is a claim that the guard
 * is wrong, and this is a claim about ONE RUN, checked against the id the
 * remote just gave us. **A value left in a shell outlives the run it was
 * for; a value that must EQUAL the run id cannot**, because the next run
 * has a different id and the guard refuses again with the new one. The
 * acknowledgement retires ONLY the refusal: the announcement arm still
 * runs, so a seat that cancels a run knowingly still hears what the last
 * completed one said.
 *
 * ── WHICH BRANCH, AND WHY NOT THE INTEGRATION BRANCH BY NAME ─────────
 * This card's criterion says *"a push to the integration branch"*,
 * because that is where this repository's CI runs today. The arm asks
 * about whatever branch the PUSHED CHECKOUT's HEAD names instead, and the
 * reason is the one `GRAPH REGEN`'s suffix list records one file over: a
 * trigger keyed to a name goes quiet the day the name changes, and going
 * quiet is the failure this guard cannot see. A branch with no runs
 * answers in one round trip and says nothing, so generality costs a
 * network call on the lane pushes this project does not make.
 *
 * ── THE COSTS, STATED RATHER THAN DISCOVERED ────────────────────────
 * A push now waits on the network. `gh` is spawned with a TIMEOUT and a
 * timeout is an inability, so a hung remote costs the wait and then
 * ALLOWS — a guard that can hang the seat's shell for ever is a guard
 * that gets turned off before it is ever right. Nothing here runs for a
 * command that is not a push, and nothing here runs before the local arms
 * above: a push already refused for a stale token spends no round trip.
 *
 * ── AND IT WIDENS THE THREAT MODEL BY EXACTLY ONE BINARY ────────────
 * `gh` is resolved OFF PATH BY NAME, like `cargo` and `git` already are
 * here, and never out of the judged tree — a checkout cannot supply the
 * binary that reads its own CI. Its arguments are an ARGV ARRAY with no
 * shell anywhere in the path, which matters more than usual because one
 * of them is a BRANCH NAME: a git ref may legally carry `;`, `$` and a
 * backtick, so a shell here would be a command-injection surface fed by
 * `git checkout -b`. Nothing this arm reads — not the branch, not a run
 * id, not a step name — is ever interpolated into a command string, and
 * `push-guard.spec.ts` drives a branch carrying those characters through
 * the real runner to say so mechanically. No secret is passed in argv
 * either: `gh` holds its own credential and this file never reads, names
 * or forwards one. What is NOT bounded, and is named rather than
 * dismissed: `gh` reads the checkout's own remotes and git config to
 * decide which GitHub repository to ask about, so a checkout the seat
 * pointed this guard at chooses the host that is contacted. That is the
 * same rooting surface `runCheck` already documents two sections up, and
 * the same answer applies — a seat that can write `cd <x> && git push`
 * can run `gh` in `<x>` directly, with the same rights and without this
 * hook.
 *
 * ── NOTHING BUT NODE BUILTINS AND THE HOOK BESIDE IT ─────────────────
 * The lane-fence hook's rule, for the lane-fence hook's reason: a lane
 * worktree ninety seconds old has no `node_modules` anywhere in it. The
 * lane facts this file needs — how a lane branch is spelled, where the
 * manifest lives, how to read one, what containment means — are
 * IMPORTED from `lane-fence.mjs` rather than re-spelled, because a rule
 * with two implementations is two chances to disagree (T-057).
 */

import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, realpathSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { LANE_BRANCH_RE, findCheckoutRoot, readHeadRef, readManifest, within } from "./lane-fence.mjs";
import {
  TOKEN_REL_PATH,
  headTree,
  judgeToken,
  readToken,
} from "./gate-token.mjs";
import {
  INTEGRATION_BRANCH,
  laneLandingVerdict,
  mergeLandingVerdict,
} from "./landing-gate.mjs";

/**
 * The committed graph, relative to the checkout root.
 *
 * HELD HERE AND COMPARED RATHER THAN TRUSTED. No module inside this
 * hook's dependency budget exports this path — `docs-scan.mjs` names it
 * only in a comment — so this file holds it, and `push-guard.spec.ts`
 * asserts that the REAL `index --check` run in the real tree names this
 * same path in its own report. That is the treatment `LANE_BRANCH_RE`
 * gets one file over: the constant is checked against the program that
 * owns the fact, so a move reds a body by name instead of going quiet.
 *
 * It is used for ONE question and never for a currency judgement: can a
 * lane regenerate the graph inside its own fence?
 */
export const GRAPH_REL_PATH = "docs/architecture/graph.json";

/**
 * What makes a checkout THIS repository's, derived rather than assumed.
 *
 * The sixth acceptance criterion says the guard shall not fire outside
 * this repository's own checkouts. The honest test is not the directory's
 * name — a clone can be called anything — but whether the program this
 * guard delegates to is even present: a checkout carrying the
 * `nputer-index` crate is a checkout where `index --check` means
 * something, and one without it is a checkout where the guard has no
 * question to ask. So the marker is the crate's own manifest, which is
 * the thing `cargo run -p nputer-index` resolves.
 */
export const INDEX_CRATE_MANIFEST_REL_PATH = "app/src-tauri/crates/nputer-index/Cargo.toml";

/**
 * The check, spelled as docs/CONVENTIONS.md's Rust bullet spells it.
 *
 * `cargo run -p nputer-index -- index --check --root ../..` run from
 * `app/src-tauri/`. THE `--root` IS LOAD-BEARING and the bullet says why
 * at length: without it the default root is the current directory, the
 * check looks for `app/src-tauri/docs/architecture/graph.json`, and it
 * exits 1 — a FALSE RED that says STALE in its headline exactly like a
 * real one. A guard that shipped that bug would refuse every push in the
 * repository, so the flag is part of the constant rather than part of a
 * caller.
 */
export const CHECK_DIR_REL_PATH = "app/src-tauri";

/** @see CHECK_DIR_REL_PATH */
export const CHECK_ARGV = Object.freeze([
  "run",
  "-p",
  "nputer-index",
  "--",
  "index",
  "--check",
  "--root",
  "../..",
]);

/**
 * `index --check`'s four exit codes, whose AUTHORITY is
 * docs/CONVENTIONS.md's Rust bullet — *"exit 0 current, 1 STALE, 2
 * usage, 3 the gate could not run"* — and the crate's own `cli.rs`.
 * `push-guard.spec.ts` reads that bullet and compares it against this
 * object, so a renumbering reds a body rather than silently turning a
 * refusal into an allow.
 *
 * ONLY `STALE` REFUSES. The other three are allows with reasons.
 */
export const CHECK_EXIT = Object.freeze({
  CURRENT: 0,
  STALE: 1,
  USAGE: 2,
  COULD_NOT_RUN: 3,
});

/**
 * git's global options that take a SEPARATE value, which the subcommand
 * scanner must step over.
 *
 * `git -C /some/dir push` has `push` as its third token, and a scanner
 * that took the first non-`git` token would call `/some/dir` the
 * subcommand and see no push at all. The `--opt=value` spellings need no
 * entry: they carry their value in one token.
 */
export const GIT_GLOBAL_OPTS_WITH_VALUE = Object.freeze([
  "-C",
  "-c",
  "--git-dir",
  "--work-tree",
  "--namespace",
  "--exec-path",
  "--config-env",
]);

/**
 * Flags that make `git push` not a push.
 *
 * `--dry-run` and its short form say in as many words that nothing
 * leaves the machine, and `--help` prints a manual. Guarding them would
 * spend a second and a half of somebody's time to protect a command that
 * pushes nothing, which is the cost this card was told to argue rather
 * than discover.
 */
export const NON_PUSHING_FLAGS = Object.freeze(["--dry-run", "-n", "--help", "-h"]);

/**
 * Words that move the shell's working directory (T-216).
 *
 * A push has NO TARGET PATH — which is the whole reason this card is not
 * `T-199`'s fix copied one file over. The repository a `git push` acts on
 * is named by the command's own `-C`, by a `cd` earlier in the same shell
 * line, or by the shell's cwd, and only the first two are written down
 * anywhere this hook can read. These three words are how the third one
 * gets moved, and finding one is how this guard learns to DOUBT its own
 * root rather than to guess a new one.
 */
export const CWD_MOVING_WORDS = Object.freeze(["cd", "pushd", "popd"]);

/**
 * git options and environment variables that RE-POINT the repository
 * without moving the shell's cwd.
 *
 * `-C` is deliberately NOT here: it moves the cwd and this guard follows
 * it, by git's own chaining rule. These re-point the git directory, the
 * work tree or the namespace INDEPENDENTLY of each other, so the tree a
 * push then carries is not a directory this guard can name — it is a
 * combination it does not model. One is enough to make the answer
 * unknowable, and an unknowable answer is declared rather than invented.
 */
export const GIT_REPOINTING_OPTS = Object.freeze(["--git-dir", "--work-tree", "--namespace"]);

/** @see GIT_REPOINTING_OPTS */
export const GIT_REPOINTING_ENV_RE =
  /^(GIT_DIR|GIT_WORK_TREE|GIT_COMMON_DIR|GIT_OBJECT_DIRECTORY|GIT_CEILING_DIRECTORIES)=/;

/**
 * What makes a token's VALUE unknowable without running the shell.
 *
 * THIS IS THE LINE BETWEEN READING AND GUESSING, and it is drawn wide on
 * purpose. `cd /Users/ujju/Projects/nputer-T-216` is not a parse: it is
 * one literal word whose value is itself. `cd "$LANE"`, `cd ~/x`,
 * `cd $(pwd)` and `cd lane-*` are values only a shell knows, and
 * `T-025-s4` ruled that a `PreToolUse` hook cannot be the shell. A token
 * carrying any of these is not resolved and not approximated — it makes
 * the whole line UNRESOLVED, which costs an announced allow and never a
 * refusal.
 */
export const UNRESOLVABLE_TOKEN_RE = /[$`"'\\*?[\]{}~()!<>]/;

/**
 * The ALLOW codes the runner SAYS OUT LOUD.
 *
 * *"IF the guard cannot run THEN it SHALL say so and ALLOW, never refuse
 * silently"* — this card's absorbed criterion, and the half that makes it
 * different from `lane-fence.mjs`, whose every allow is silent. The
 * distinction these four draw is between an ORDINARY allow and one where
 * the graph went UNVERIFIED: nobody needs to hear that `ls` is not a
 * push, and everybody needs to hear that a push went out because the
 * check could not answer.
 *
 * IT IS SAID AT EXIT 0, NEVER AT A NON-ZERO CODE. Exit 2 is the
 * documented refusal, and a guard that announced itself by exiting 1
 * would be betting that no harness ever treats a non-zero hook as a
 * block — a bet that fails CLOSED, which is the one direction this guard
 * may never fail. The cost is that the notice's visibility depends on
 * how a harness surfaces a passing hook's stderr; that is a stated limit
 * and not a silent one.
 */
export const ANNOUNCED_ALLOW_CODES = Object.freeze([
  "check-could-not-run",
  "check-inconclusive",
  "lane-fence-unreadable",
  "no-command-to-read",
  "landing-gate-cannot-compare",
  // T-216. THE MEMBERSHIP TEST IS THIS LIST'S OWN: an ALLOW reached with
  // a question UNANSWERED. Here the unanswered question is the first one
  // — WHICH REPOSITORY — so every other question went unasked with it,
  // which makes this the loudest member rather than an exception to the
  // rule. Its silent sibling `push-repository-unresolved-outside` is
  // deliberately absent for `not-this-repository`'s reason: outside this
  // repository's checkouts the guard has nothing to say, and saying it
  // anyway is how a notice becomes noise nobody reads.
  "push-repository-unresolved",
]);
// T-203's TWO ANNOUNCEMENTS ARE DELIBERATELY NOT IN THAT LIST, and the
// reason is what the list actually is. It is a FILTER on a Decision's own
// `code`, consulted when a returned decision might or might not deserve
// saying; the cheap checks' `could not run` and the token's `no tree to
// key against` are NOTICES, which `decide` collects and the runner prints
// whatever the verdict is. Adding them would put two entries in a list
// nothing consults, and a census with dead rows is a census a reader
// stops trusting. Each is greppable by its own opening sentence instead.
// T-237 ADDS FIVE SENTENCES AND NO ROW, for that same reason twice over.
// `ci-run-in-flight` and `ci-unreadable` are BLOCKS, and this list is
// consulted only where a returned Decision might or might not deserve
// saying — a refusal always deserves saying, and the runner prints one
// whatever this list holds. The CI arm's `CI WAS NOT ASKED`, `CI'S
// NEWEST RUN WAS NOT JUDGED`, `WILL CANCEL IT` and `CI IS RED UNDER THIS
// PUSH` are NOTICES, printed whatever verdict the arms below reach, and
// that is the property they are for: a red CI must survive a push the
// graph arm then refuses, because the two facts are about different
// machines.

/**
 * THE CHEAP CHECKS (T-203) — the script, the flag and the four codes.
 *
 * ── WHY A SUBPROCESS AND NOT AN IMPORT ───────────────────────────────
 * The checks read the whole live board, which needs `docs-scan.mjs` and
 * `dispatch-brief.mjs`. Importing those here would load them on EVERY
 * `Bash` tool call in a session, and this hook's stated property is that
 * a command which is not a push costs node's startup and a regex. So they
 * are SPAWNED, exactly as `cargo` is, and exactly as `landing-gate.mjs`
 * spawns its expander.
 *
 * ── THE CODES ARE READ INDIVIDUALLY, FOR `index --check`'S REASON ────
 * Only 1 refuses. Collapsing 3 (`the checks could not run`) into 1 would
 * turn an inability into a verdict and refuse every push made in a
 * checkout where the script is absent — which includes every checkout
 * that is not this repository's.
 *
 * ── WHOSE COPY RUNS: THE HOOK'S OWN ──────────────────────────────────
 * Resolved against this file's URL rather than against the judged root,
 * because the hook itself is loaded from the DISPATCHING checkout while
 * the root it judges may be a lane worktree. The script takes `--root`
 * and judges the tree it is pointed at, so the two are separate on
 * purpose: one implementation of the rules, applied to whichever tree is
 * being pushed.
 */
export const CHEAP_CHECKS_PATH = fileURLToPath(
  new URL("../../tools/e2e/scripts/push-checks.mjs", import.meta.url),
);

/** @see CHEAP_CHECKS_PATH */
export const CHEAP_CHECKS_EXIT = Object.freeze({
  CLEAN: 0,
  FOUND: 1,
  USAGE: 2,
  COULD_NOT_RUN: 3,
});

/* ═════════════ T-237 — THE RUN THAT IS ALREADY RUNNING ══════════════
 *
 * The constants this arm reads CI with. Every one of them is compared
 * against an authority by `push-guard.spec.ts` rather than trusted: the
 * subcommands against docs/CONVENTIONS.md's own *"AND THEN READ IT"*
 * bullet, the step→package map against `.github/workflows/ci.yml`'s own
 * `working-directory:` keys, and the whole argv against a shim that
 * records each argument on its own line.
 *
 * ── FOUR FACTS ABOUT `gh` THAT THE OBVIOUS CODE GETS WRONG ──────────
 * Measured against this repository's real remote on 2026-09-02, and
 * written down because every one of them produces a guard that looks
 * right and is silently useless:
 *
 *   A RUNNING RUN'S `conclusion` IS THE EMPTY STRING, not `null` and not
 *     absent. A shape check that demands a NON-EMPTY string rejects every
 *     live run — and under this arm's refuse-on-unreadable rule that
 *     turns the offline ALLOW into a hard block on exactly the runs it
 *     exists to catch.
 *   `updatedAt` IS NOT A CLOCK. Run 33577276465 read `updatedAt`
 *     00:55:14 while still genuinely running at 01:02:13Z, so an elapsed
 *     time computed from it is wrong and stays plausible. It comes from
 *     `startedAt` — the run's own start — and falls back to `createdAt`.
 *   `ci.yml` SETS `cancel-in-progress: true`, so `cancelled` outnumbers
 *     `failure` about two to one over the last sixty runs. THE NEWEST
 *     COMPLETED RUN IS USUALLY A RUN THAT REACHED NO VERDICT, so an arm
 *     that reads `runs.find(completed)` would have missed this card's own
 *     instance — the five red hours of 2026-09-01 sat behind exactly
 *     such a stack of superseded runs. `newestVerdictRun` skips them and
 *     SAYS HOW MANY it skipped, because that count is the batching
 *     rule's own footprint.
 *   `gh`'s EXIT 1 IS OVERLOADED across a misspelled `--json` field, HTTP
 *     401, 404, no GitHub remote and a dead network — so *"non-zero
 *     means CI could not be asked"* swallows this guard's own bugs and
 *     reports them as being offline. `classifyGhFailure` discriminates
 *     the three it can name and DISCLOSES the rest as unrecognised.
 *     `gh` off PATH is `status: null` with `ENOENT`, never 127: 127
 *     needs a shell, and there is no shell here.
 */

/**
 * The GitHub CLI, RESOLVED OFF PATH BY NAME.
 *
 * Never out of the judged tree, and the distinction is the one
 * `runCheck` already draws for `cargo`: this guard may be pointed at a
 * checkout by the command text, and a checkout that could supply the
 * binary which reads its own CI could answer any question it liked.
 */
export const GH_BIN = "gh";

/**
 * How long a push may wait on the network before this guard gives up.
 *
 * A TIMEOUT IS AN INABILITY, so it ends in the announced ALLOW like
 * every other one — never in a refusal. It exists because this hook runs
 * INSIDE the seat's own `Bash` call: a `gh` waiting on an unreachable
 * host with no bound would hang the session rather than the push, which
 * is the failure that gets a guard disabled before it is ever right.
 */
export const GH_TIMEOUT_MS = 15_000;

/**
 * How many runs to ask for.
 *
 * TWO QUESTIONS, ONE ROUND TRIP. The newest run answers *"is one still
 * running"*; the newest run whose `status` is `completed` answers *"what
 * did the last verdict say"*, and they are different runs exactly when
 * the first question's answer is yes. `--limit 1` would answer the first
 * and make the second unaskable at the one moment it is interesting.
 */
export const RUN_LIST_LIMIT = 10;

/**
 * The fields asked of `gh run list --json`.
 *
 * `gh run list --json` with no value PRINTS the fields it publishes, and
 * a body compares this list against that output — so a field `gh`
 * retires reds a test by name instead of turning this arm into an
 * announced allow nobody reads.
 */
export const RUN_LIST_JSON_FIELDS = Object.freeze([
  "conclusion",
  "createdAt",
  "databaseId",
  "displayTitle",
  "headSha",
  "startedAt",
  "status",
  "url",
]);

/**
 * The subset a VERDICT rests on, which is where the parser's strictness
 * is spent — and it is THREE fields, not the eight above.
 *
 * `status` decides the refusal, `conclusion` decides the announcement,
 * and `databaseId` is what an acknowledgement is checked against, so a
 * missing one would leave a refusal with no clearable remedy. EVERYTHING
 * ELSE COSTS A PHRASE AND NEVER A VERDICT: without `headSha` the reach
 * sentence says it cannot compare, without `startedAt`/`createdAt` the
 * elapsed time says it is unreadable, without `url` a line is missing.
 * Strictness over those would refuse a push for cosmetic drift in
 * somebody else's CLI, which is the direction this file may not fail.
 */
export const RUN_LIST_REQUIRED_FIELDS = Object.freeze([
  "conclusion",
  "databaseId",
  "status",
]);

/** @see RUN_LIST_JSON_FIELDS */
export const RUN_VIEW_JSON_FIELDS = Object.freeze(["jobs"]);

/**
 * `gh run list`'s argv — AN ARRAY, and the branch is an ELEMENT of it.
 *
 * A git ref may legally carry `;`, `$`, `&` and a backtick, so a branch
 * name interpolated into a command string would be a command-injection
 * surface fed by `git checkout -b`. There is no shell anywhere in this
 * arm's path; `push-guard.spec.ts` drives such a branch through the real
 * runner and reads the shim's own record of each argument.
 *
 * @param {string} branch
 * @returns {string[]}
 */
export function ghRunListArgv(branch) {
  return [
    "run",
    "list",
    "--branch",
    branch,
    "--limit",
    String(RUN_LIST_LIMIT),
    "--json",
    RUN_LIST_JSON_FIELDS.join(","),
  ];
}

/** @see ghRunListArgv @param {string} runId @returns {string[]} */
export function ghRunViewArgv(runId) {
  return ["run", "view", runId, "--json", RUN_VIEW_JSON_FIELDS.join(",")];
}

/**
 * The statuses that mean A RUN IS STILL GOING, so a push would cancel it.
 *
 * NAMED RATHER THAN DERIVED FROM `!== "completed"`, and the direction of
 * the failure is why. A negated test treats every status GitHub invents
 * as running and refuses pushes nobody can clear; this list treats an
 * unknown status as UNKNOWN and announces it, which is this file's rule
 * for a question it could not answer. The cost of the choice is stated:
 * a future status meaning "running" that is not on this list goes
 * unrefused until somebody adds it, which is the pre-guard state.
 */
export const ACTIVE_RUN_STATUSES = Object.freeze([
  "queued",
  "in_progress",
  "waiting",
  "requested",
  "pending",
]);

/** @see ACTIVE_RUN_STATUSES */
export const COMPLETED_RUN_STATUS = "completed";

/**
 * The conclusions of a COMPLETED run that are NOT a verdict about the
 * tree, and are therefore SKIPPED OVER when looking for the last thing
 * CI actually said.
 *
 * ── THIS LIST IS THE CARD'S OWN INSTANCE, MEASURED ──────────────────
 * `.github/workflows/ci.yml` sets `cancel-in-progress: true`, which is
 * the OTHER half of the defect this arm exists for: a rapid push does
 * not merely supersede a run, it leaves a `cancelled` run behind that
 * looks completed and reached nothing. Over this repository's last sixty
 * runs, `cancelled` outnumbers `failure` about two to one — so a guard
 * that announced *"the newest COMPLETED run"* would have been silent
 * through the five red hours of 2026-09-01, reading a stack of
 * superseded cancellations as the verdict. The empty string is here for
 * the same reason from the other direction: a run still going has no
 * conclusion at all.
 */
export const NON_VERDICT_CONCLUSIONS = Object.freeze(["cancelled", "skipped", ""]);

/**
 * The conclusion this arm ANNOUNCES, which is this card's word.
 *
 * `cancelled`, `timed_out` and `startup_failure` are deliberately absent
 * — a cancelled run is usually THIS defect's own footprint rather than a
 * verdict about the tree, and reading one as a red would announce the
 * guard's own subject back at the seat. Widening this is a card, not an
 * edit.
 */
export const FAILED_CONCLUSION = "failure";

/**
 * The acknowledgement that lets a seat cancel a run KNOWINGLY.
 *
 * ITS VALUE MUST BE THE RUN'S OWN ID. This is not an override flag —
 * this file refuses those and says so twice — because an override flag
 * is a standing claim that the guard is wrong, while this is a claim
 * about ONE RUN checked against the id the remote just handed us. A
 * value left in a shell cannot outlive the run it was for.
 */
export const CANCEL_CI_ENV = "NPUTER_CANCEL_CI";

/**
 * `gh`'s exit codes, to the extent it publishes any — and the point of
 * this object is how LITTLE it publishes.
 *
 * **EXIT 1 IS OVERLOADED AND MEANS ALMOST NOTHING**: a misspelled
 * `--json` field, an HTTP 401, a 404, a checkout with no GitHub remote
 * and a dead network all arrive as 1. So *"non-zero means CI could not
 * be asked"* — the obvious code — quietly relabels THIS GUARD'S OWN BUGS
 * as being offline, and a guard whose bugs report as a benign limit is a
 * guard nobody ever fixes. `classifyGhFailure` names the three cases it
 * can actually identify and DISCLOSES everything else as unrecognised;
 * all four still ALLOW, because this card's third criterion says an
 * unaskable CI allows.
 *
 * ABSENT IS NOT AN EXIT CODE AT ALL. Off PATH, `spawnSync` returns
 * `status: null` with `ENOENT` — 127 is what a SHELL reports, and there
 * is no shell anywhere in this arm.
 */
export const GH_EXIT = Object.freeze({ OK: 0, GENERIC: 1, UNAUTHENTICATED: 4 });

/**
 * `gh`'s own words for a checkout it cannot map to a GitHub repository.
 *
 * Matched as a PHRASE rather than by exit code, because the code is 1
 * and so is everything else. This is the case every fixture in
 * `push-guard.spec.ts` would hit if it ever reached the real `gh` — a
 * local bare `origin` is not a known GitHub host — which is why the
 * fixtures shim `gh` on their own `bin/` instead.
 */
export const GH_NO_GITHUB_REMOTE_RE = /point to a known GitHub host|no git remotes found/i;

/**
 * Where a failing STEP's package is written down — the workflow itself.
 *
 * NEVER TYPE A PATH YOU CAN DERIVE (docs/CONVENTIONS.md). `gh`'s
 * `jobs[].steps[].name` is the workflow's own `name:` verbatim, and the
 * workflow puts each step's package in its `working-directory:`. So the
 * map from *"which step failed"* to *"which package it was testing"* is
 * READ out of the repository being pushed, not held here — a step
 * renamed in `ci.yml` moves both sides at once, and a step this scanner
 * cannot place is SAID to be unplaceable rather than guessed at.
 */
export const CI_WORKFLOW_REL_PATH = ".github/workflows/ci.yml";

/**
 * @typedef {object} Decision
 * @property {"allow" | "block"} verdict
 * @property {string} code    a stable, greppable name for WHY
 * @property {string} reason  the sentence the blocked session reads
 * @property {string[]} [notices] things said ALONGSIDE the verdict rather
 *   than instead of it — see `decide`
 */

/** @param {string} code @param {string} reason @returns {Decision} */
function allow(code, reason) {
  return { verdict: "allow", code, reason };
}

/** @param {string} code @param {string} reason @returns {Decision} */
function block(code, reason) {
  return { verdict: "block", code, reason };
}

/**
 * Every git SUBCOMMAND a command line invokes, in order.
 *
 * ── THIS IS DELIBERATELY NOT SHELL PARSING ───────────────────────────
 * `lane-fence.mjs`'s limit 1 refuses to widen its matcher to `Bash`
 * because finding a WRITE TARGET in a shell command means parsing shell,
 * which answers confidently and wrongly. The question here is much
 * smaller: this asks only whether the word `push` follows the word
 * `git`, and it never has to be right about a path.
 *
 * ── A FALSE POSITIVE REFUSES, AND THIS COMMENT ONCE CLAIMED OTHERWISE ─
 * It said a false positive *"costs a second and a half and then allows,
 * because only the check can refuse"*. **That is false, and a blind
 * verifier measured it false**: against a STALE graph, `echo git push`,
 * `man git push` and `grep -rn git push /tmp` each reach exit 2 — PUSH
 * REFUSED — through the real runner. This scanner splits on whitespace
 * and cannot tell a quotation, a manual page or a search pattern from a
 * command, so any segment carrying `git` and then `push` is treated as a
 * push.
 *
 * **THE COST IS REAL AND IS ACCEPTED WITH ITS EYES OPEN**, bounded by
 * three facts rather than by the scanner's accuracy: it can only refuse
 * when the graph is ACTUALLY stale, which is a regen the seat already
 * owes; the refusal is loud and names its reason, so a puzzled reader is
 * one line from understanding it; and one regen clears the false positive
 * and the true one together. What it is NOT is silent, and it is not a
 * refusal that leaves the seat without a remedy.
 *
 * A FALSE NEGATIVE is a push this guard did not see, which is exactly the
 * pre-guard state and never worse than it.
 *
 * ── THE LIMITS, DECLARED RATHER THAN DISCOVERED ──────────────────────
 * A push reached through a shell ALIAS, a FUNCTION, a script file, an
 * `eval`, or a `git` binary invoked by an absolute path is not seen
 * here. Neither is one hidden in a quoted string this scanner splits on
 * whitespace. Each is a hole and each is the pre-guard state; none of
 * them is a false REFUSAL, which is the failure that would get the guard
 * turned off.
 *
 * @param {string} command
 * @returns {{ subcommand: string, tokens: string[], globals: string[], segment: number }[]}
 */
export function gitInvocations(command) {
  /** @type {{ subcommand: string, tokens: string[], globals: string[], segment: number }[]} */
  const found = [];
  const segs = segments(command);
  for (let s = 0; s < segs.length; s += 1) {
    const tokens = /** @type {{ tokens: string[] }} */ (segs[s]).tokens;
    for (let i = 0; i < tokens.length; i += 1) {
      if (tokens[i] !== "git") continue;
      let j = i + 1;
      while (j < tokens.length) {
        const tok = /** @type {string} */ (tokens[j]);
        if (!tok.startsWith("-")) break;
        j += GIT_GLOBAL_OPTS_WITH_VALUE.includes(tok) ? 2 : 1;
      }
      if (j < tokens.length) {
        found.push({
          subcommand: /** @type {string} */ (tokens[j]),
          tokens: tokens.slice(j),
          // T-216 needs the tokens this scanner STEPS OVER, because `-C`
          // is among them and `-C` is where a push names its own
          // repository. They were discarded before; nothing about the
          // stepping-over changed.
          globals: tokens.slice(i + 1, j),
          segment: s,
        });
      }
      break;
    }
  }
  return found;
}

/**
 * The command line's segments, each with THE SEPARATOR THAT PRECEDED IT.
 *
 * ── ONE SPLITTER, TWO READERS (T-216, and T-057's rule) ──────────────
 * `gitInvocations` asks *"is there a push"* and never cared which
 * separator joined what. `pushCwds` asks *"what is the working directory
 * AT the push"*, and there the separator is load-bearing: `&&` means the
 * left side SUCCEEDED, and nothing else does. Two splitters would be two
 * chances to segment a line differently, so there is one, and the
 * segmentation it produces is BYTE-FOR-BYTE the one `gitInvocations`
 * always produced — `&&` and `||` are consumed whole by the alternation
 * before the character class can take them apart, exactly as the old
 * `[\n;|&]+` consumed them whole.
 *
 * The first segment's separator is the empty string: nothing preceded it.
 *
 * @param {string} command
 * @returns {{ sep: string, tokens: string[] }[]}
 */
export function segments(command) {
  // The capture group is what keeps the separators; `String.split` with
  // one group alternates content, separator, content, …
  const parts = command.split(/(&&|\|\||[\n;|&]+)/);
  /** @type {{ sep: string, tokens: string[] }[]} */
  const out = [];
  let sep = "";
  for (let i = 0; i < parts.length; i += 1) {
    const part = /** @type {string} */ (parts[i]);
    if (i % 2 === 1) {
      sep = part;
      continue;
    }
    out.push({ sep, tokens: part.trim().split(/\s+/).filter((t) => t !== "") });
  }
  return out;
}

/**
 * Does this command line push?
 *
 * @param {string} command
 * @returns {boolean}
 */
export function isPush(command) {
  return gitInvocations(command).some(
    (inv) =>
      inv.subcommand === "push" && !inv.tokens.some((t) => NON_PUSHING_FLAGS.includes(t)),
  );
}

/**
 * WHICH WORKING DIRECTORY DOES THE PUSH ACTUALLY RUN IN? (T-216)
 *
 * ── THE DEFECT THIS REPLACES ─────────────────────────────────────────
 * `decide` used to answer this with `findCheckoutRoot(request.cwd)` — the
 * WRITER's seat — which is `T-199`'s defect class in the guard next door.
 * In this project's dispatch shape a lane session's `request.cwd` is the
 * DISPATCHING checkout, so `cd <lane> && git push` had its graph, its
 * board, its fence and its verdict token all judged **in a tree the push
 * does not contain**: a different HEAD, a different `graph.json`, a
 * different `HEAD^{tree}` for T-203's token to be keyed against. The
 * verdict could be green over stale commits and red over current ones,
 * and in both directions it was a CONFIDENT answer about somebody else's
 * tree. That is worse than no answer, which is why the remedy below is
 * not "root somewhere else" but "root only on evidence".
 *
 * ── IT IS NOT `T-199`'s FIX, BECAUSE A PUSH HAS NO TARGET PATH ───────
 * A write names the file it writes. A push names nothing: the repository
 * it acts on comes from the command's own `-C`, from a `cd` earlier in
 * the same shell line, or from the shell's cwd. So this function does not
 * PARSE the line — `lane-fence.mjs`'s limit 1 and `T-025-s4` both rule
 * that out, and `gitInvocations`'s own header records what a whitespace
 * scanner cannot see. It reads only the two constructs whose effect is
 * FULLY DETERMINED by the text, and declares everything else unresolved:
 *
 *   1. `git -C <dir> push` — git's own option, applied by git's own
 *      chaining rule (later relative `-C`s resolve against earlier ones).
 *      This is not an inference about the shell; it is what git does.
 *   2. `cd <literal> && … && git push` — the shell's cwd at the push,
 *      when every step to it is spelled out and joined by `&&`.
 *   3. Neither — nothing moved the cwd, so `request.cwd` IS the push's
 *      cwd, which is what the old code assumed unconditionally and what
 *      it is still right about.
 *
 * ── WHY `&&` IS LOAD-BEARING AND `;` IS NOT ALLOWED ──────────────────
 * This is the whole argument for reading a `cd` at all. Under `&&`, IF
 * THE PUSH RUNS THEN THE `cd` SUCCEEDED — the shell guarantees it, so a
 * `cd` into a directory the guard resolved is a cwd the guard KNOWS.
 * Under `;` it does not: `cd /gone ; git push` runs the push in the OLD
 * directory, and a guard that followed the `cd` there would judge a tree
 * the push never touches — this card's own defect, reintroduced by its
 * own fix. Under `||` the `cd` may not have run at all. So a single
 * non-`&&` separator anywhere between the first `cd` and the push makes
 * the line UNRESOLVED, and `cd /a || cd /b && git push` — where the
 * naive walk lands on `/b` and the shell lands on `/a` — is the worked
 * example that fixes the rule.
 *
 * ── EVERYTHING ELSE IS DOUBT, AND DOUBT IS DECLARED ──────────────────
 * A bare `cd` (the shell's `$HOME`), `cd -`, a `cd` with a value carrying
 * any of `UNRESOLVABLE_TOKEN_RE`, a `pushd`/`popd`, a `cd` word anywhere
 * but at the head of its segment, a `--git-dir`/`--work-tree`/
 * `--namespace`, a `GIT_DIR=…` prefix, a resolved directory that is not
 * there, or two pushes disagreeing about where they run. None of these is
 * approximated. Each returns `unresolved` WITH ITS OWN SENTENCE, and
 * `decide` turns that into an announced ALLOW — never a refusal, because
 * not knowing which repository a push acts on is THIS GUARD'S OWN
 * INABILITY, and this file's header spends a section on why an inability
 * may not become a verdict. The seat is told the spelling this guard can
 * read exactly: `git -C <dir> push`.
 *
 * THE RESIDUAL IS REAL AND IS STATED: a lane push spelled with anything
 * outside the two constructs above goes UNJUDGED where it used to be
 * MISJUDGED. That is a trade of a wrong answer for no answer plus a loud
 * sentence, which is the only direction this guard is allowed to fail.
 *
 * @param {string} command
 * @param {string} writerCwd  the shell's own cwd — `request.cwd`
 * @returns {{ dirs: string[] } | { unresolved: string }}
 */
export function pushCwds(command, writerCwd) {
  const segs = segments(command);
  /** @type {Map<number, { globals: string[] }>} */
  const pushes = new Map();
  for (const inv of gitInvocations(command)) {
    if (inv.subcommand !== "push") continue;
    if (inv.tokens.some((t) => NON_PUSHING_FLAGS.includes(t))) continue;
    pushes.set(inv.segment, { globals: inv.globals });
  }

  let dir = writerCwd;
  let movedAt = -1;
  /** @type {string[]} */
  const dirs = [];
  for (let s = 0; s < segs.length; s += 1) {
    const seg = /** @type {{ sep: string, tokens: string[] }} */ (segs[s]);
    const push = pushes.get(s);
    if (push !== undefined) {
      // THE CHAIN IS CHECKED AT THE PUSH, over the whole span, because a
      // broken separator ANYWHERE after a `cd` can leave the shell in a
      // directory the walk above never visited.
      if (movedAt >= 0) {
        for (let k = 1; k <= s; k += 1) {
          if (/** @type {{ sep: string }} */ (segs[k]).sep !== "&&") {
            return {
              unresolved:
                "a `cd` reaches this push through a separator that is not `&&`, so the shell's " +
                "own working directory at the push is not determined by the text",
            };
          }
        }
      }
      // The environment prefix sits BEFORE the word `git`, so it is in
      // the segment and not in the invocation's globals — and it moves
      // the repository exactly as `--git-dir` does.
      const env = seg.tokens.find((t) => GIT_REPOINTING_ENV_RE.test(t));
      if (env !== undefined) {
        return {
          unresolved: `\`${env.slice(0, env.indexOf("="))}\` re-points the repository from the environment`,
        };
      }
      const named = repointedBy(dir, push.globals);
      if ("unresolved" in named) return named;
      dirs.push(named.dir);
      continue;
    }
    if (seg.tokens.length === 0) continue;
    const head = /** @type {string} */ (seg.tokens[0]);
    if (!CWD_MOVING_WORDS.includes(head)) {
      // A `cd` that is not the segment's own command — `sudo cd`,
      // `echo cd /x`, a `--grep cd` — is not read, and is not ignored
      // either. The word is evidence that this scanner is out of its
      // depth, which is a thing to SAY rather than to step past.
      if (seg.tokens.some((t) => CWD_MOVING_WORDS.includes(t))) {
        return {
          unresolved:
            `a \`${/** @type {string} */ (seg.tokens.find((t) => CWD_MOVING_WORDS.includes(t)))}\` ` +
            "appears somewhere this scanner cannot read it as a command",
        };
      }
      continue;
    }
    if (head !== "cd") {
      return { unresolved: `\`${head}\` moves the working directory to a place this line never names` };
    }
    const operands = seg.tokens.slice(1).filter((t) => t !== "--");
    if (operands.length !== 1) {
      return {
        unresolved:
          operands.length === 0
            ? "a bare `cd` moves to the shell's `$HOME`, which is not in this command"
            : "a `cd` with more than one operand",
      };
    }
    const target = /** @type {string} */ (operands[0]);
    if (target === "-") {
      return { unresolved: "`cd -` moves to a directory only the shell remembers" };
    }
    if (UNRESOLVABLE_TOKEN_RE.test(target)) {
      return { unresolved: `\`cd ${target}\` is a value only a shell knows` };
    }
    const moved = path.resolve(dir, target);
    if (!isDirectory(moved)) {
      return { unresolved: `\`cd ${target}\` resolves to ${moved}, which is not a directory now` };
    }
    dir = moved;
    movedAt = s;
  }

  if (dirs.length === 0) {
    // UNREACHABLE FROM `decide`, which asks `isPush` first, and kept
    // anyway: this function is exported and a caller that skipped that
    // gate must get an answer it can act on rather than an empty list.
    return { unresolved: "this line carries no `git push` for a working directory to be found for" };
  }
  const distinct = [...new Set(dirs)];
  if (distinct.length > 1) {
    return {
      unresolved: `this line pushes from ${String(distinct.length)} different working directories`,
    };
  }
  return { dirs: distinct };
}

/**
 * Apply the push invocation's OWN git options to the cwd it inherits.
 *
 * `-C` is followed because it is git's own instruction to start
 * somewhere else, and it is chained the way git chains it: each value
 * resolved against the one before, an absolute value replacing them.
 * `--git-dir`, `--work-tree` and `--namespace` are NOT followed —
 * they re-point the repository independently of the working directory,
 * so the tree the push then carries is a combination this guard does not
 * model, and a guard that answered anyway would be inventing evidence.
 *
 * @param {string} from    the cwd the invocation starts in
 * @param {string[]} globals  the tokens between `git` and `push`
 * @returns {{ dir: string } | { unresolved: string }}
 */
export function repointedBy(from, globals) {
  let dir = from;
  for (let k = 0; k < globals.length; k += 1) {
    const tok = /** @type {string} */ (globals[k]);
    const eq = tok.indexOf("=");
    const bare = eq === -1 ? tok : tok.slice(0, eq);
    if (GIT_REPOINTING_OPTS.includes(bare)) {
      return { unresolved: `\`${bare}\` re-points the repository away from any directory this guard can name` };
    }
    if (GIT_REPOINTING_ENV_RE.test(tok)) {
      return { unresolved: `\`${bare}\` re-points the repository from the environment` };
    }
    if (tok !== "-C") {
      if (GIT_GLOBAL_OPTS_WITH_VALUE.includes(tok)) k += 1;
      continue;
    }
    const value = globals[k + 1];
    k += 1;
    if (value === undefined || UNRESOLVABLE_TOKEN_RE.test(value)) {
      return { unresolved: "a `-C` whose value is not a literal path" };
    }
    dir = path.resolve(dir, value);
  }
  if (!isDirectory(dir)) {
    return { unresolved: `the push would run in ${dir}, which is not a directory now` };
  }
  return { dir };
}

/**
 * Is this a directory that exists? A `statSync` this file can afford
 * because it runs only after `isPush` has already said yes.
 *
 * @param {string} p
 * @returns {boolean}
 */
function isDirectory(p) {
  try {
    return statSync(p).isDirectory();
  } catch {
    return false;
  }
}

/**
 * Are these two paths the same directory?
 *
 * COMPARED THROUGH `realpathSync` because a macOS `/var` is a symlink to
 * `/private/var`, and two spellings of one directory would otherwise
 * make this guard announce a divergence that does not exist. A path that
 * cannot be resolved falls back to its lexical form, which is the
 * comparison this replaced and is never worse than it.
 *
 * @param {string} a @param {string} b @returns {boolean}
 */
function sameDirectory(a, b) {
  const real = (/** @type {string} */ p) => {
    try {
      return realpathSync(p);
    } catch {
      return path.resolve(p);
    }
  };
  return real(a) === real(b);
}

/**
 * @typedef {object} CheckResult
 * @property {number | null} status  the check's exit code, or null when it never ran
 * @property {string} stdout         the check's own report
 * @property {string} stderr         cargo's build chatter, and any failure
 * @property {string} [problem]      why it never ran at all
 * @property {string} [spawnError]   the OS error code when it never started — `ENOENT`, `ETIMEDOUT`
 *   (T-237). `gh` off PATH is `status: null` + `ENOENT` and NEVER 127, because 127 is what a SHELL
 *   reports and nothing in this file uses one. Carried as a FIELD rather than sniffed back out of a
 *   message, so `classifyGhFailure` can tell ABSENT from every other inability without a regex over
 *   somebody else's prose.
 */

/**
 * Run `index --check` and hand back what it said.
 *
 * NOTHING IS INTERPRETED HERE. The caller reads the exit code against
 * `CHECK_EXIT`; this function's whole job is to start the documented
 * command in the documented directory and survive its failure to start.
 *
 * @param {string} root
 * @returns {CheckResult}
 */
export function runCheck(root) {
  /** @type {ReturnType<typeof spawnSync>} */
  let out;
  try {
    out = spawnSync("cargo", [...CHECK_ARGV], {
      cwd: path.join(root, CHECK_DIR_REL_PATH),
      encoding: "utf8",
      maxBuffer: 32 * 1024 * 1024,
    });
  } catch (err) {
    return {
      status: null,
      stdout: "",
      stderr: "",
      problem: `cargo could not be started (${err instanceof Error ? err.message : String(err)})`,
    };
  }
  if (out.error !== undefined && out.error !== null) {
    return {
      status: null,
      stdout: String(out.stdout ?? ""),
      stderr: String(out.stderr ?? ""),
      problem: `cargo could not be started (${out.error.message})`,
    };
  }
  if (out.status === null) {
    return {
      status: null,
      stdout: String(out.stdout ?? ""),
      stderr: String(out.stderr ?? ""),
      problem: `the check was killed by a signal (${String(out.signal)}) before it could answer`,
    };
  }
  return {
    status: out.status,
    stdout: String(out.stdout ?? ""),
    stderr: String(out.stderr ?? ""),
  };
}

/**
 * Run the cheap checks against `root` and hand back what they said.
 *
 * NOTHING IS INTERPRETED HERE, the same contract `runCheck` has: this
 * starts the documented script and survives its failure to start, and the
 * caller reads the exit code against `CHEAP_CHECKS_EXIT`.
 *
 * @param {string} root
 * @returns {CheckResult}
 */
export function runCheapChecks(root) {
  if (!existsSync(CHEAP_CHECKS_PATH)) {
    return {
      status: null,
      stdout: "",
      stderr: "",
      problem: `${CHEAP_CHECKS_PATH} is not present in this checkout`,
    };
  }
  /** @type {ReturnType<typeof spawnSync>} */
  let out;
  try {
    out = spawnSync(process.execPath, [CHEAP_CHECKS_PATH, "--root", root], {
      cwd: root,
      encoding: "utf8",
      maxBuffer: 32 * 1024 * 1024,
    });
  } catch (err) {
    return {
      status: null,
      stdout: "",
      stderr: "",
      problem: `the cheap checks could not be started (${err instanceof Error ? err.message : String(err)})`,
    };
  }
  if (out.error !== undefined && out.error !== null) {
    return {
      status: null,
      stdout: String(out.stdout ?? ""),
      stderr: String(out.stderr ?? ""),
      problem: `the cheap checks could not be started (${out.error.message})`,
    };
  }
  if (out.status === null) {
    return {
      status: null,
      stdout: String(out.stdout ?? ""),
      stderr: String(out.stderr ?? ""),
      problem: `the cheap checks were killed by a signal (${String(out.signal)}) before answering`,
    };
  }
  return {
    status: out.status,
    stdout: String(out.stdout ?? ""),
    stderr: String(out.stderr ?? ""),
  };
}

/* ═════════════ T-237 — THE RUN THAT IS ALREADY RUNNING ══════════════ */

/**
 * @typedef {object} Run
 * @property {string} id          `databaseId`, as a string — it is an identifier, never arithmetic
 * @property {string} status      `queued` | `in_progress` | `completed` | …
 * @property {string} conclusion  THE EMPTY STRING while a run is live; `success` | `failure` | `cancelled` | … when it ends
 * @property {string} headSha     the commit that run measured, or `` — a sentence, never a verdict
 * @property {string} startedAt   ISO 8601, the run's own start; `updatedAt` is NOT this and lies
 * @property {string} createdAt   ISO 8601, the fallback when `startedAt` is absent
 * @property {string} url         `` when `gh` did not answer one
 * @property {string} title       `displayTitle`, or `` — a sentence, never a verdict
 */

/**
 * Run `gh` with an ARGV ARRAY and hand back what it said.
 *
 * NOTHING IS INTERPRETED HERE — `runCheck`'s contract, for `runCheck`'s
 * reason: this starts the documented command in the judged checkout and
 * survives its failure to start, and the caller decides what the answer
 * means. The cwd is the ROOT BEING PUSHED (T-216), because `gh` resolves
 * which GitHub repository to ask about from that checkout's own remotes
 * — asking about the seat's directory would be this guard's oldest
 * defect wearing a new binary.
 *
 * THE ENVIRONMENT IS NARROWED RATHER THAN INHERITED WHOLE for the three
 * variables that would otherwise make a hook interactive or decorated:
 * `gh` must never open a pager or a prompt inside a `PreToolUse` hook
 * whose stdout nobody is watching.
 *
 * @param {string} root
 * @param {string[]} argv
 * @returns {CheckResult}
 */
export function runGh(root, argv) {
  /** @type {ReturnType<typeof spawnSync>} */
  let out;
  try {
    out = spawnSync(GH_BIN, [...argv], {
      cwd: root,
      encoding: "utf8",
      maxBuffer: 32 * 1024 * 1024,
      timeout: GH_TIMEOUT_MS,
      env: { ...process.env, GH_PAGER: "", GH_PROMPT_DISABLED: "1", NO_COLOR: "1" },
    });
  } catch (err) {
    return {
      status: null,
      stdout: "",
      stderr: "",
      spawnError: err instanceof Error ? String(/** @type {NodeJS.ErrnoException} */ (err).code ?? "") : "",
      problem: `${GH_BIN} could not be started (${err instanceof Error ? err.message : String(err)})`,
    };
  }
  if (out.error !== undefined && out.error !== null) {
    const code = String(/** @type {NodeJS.ErrnoException} */ (out.error).code ?? "");
    return {
      status: null,
      stdout: String(out.stdout ?? ""),
      stderr: String(out.stderr ?? ""),
      spawnError: code,
      problem:
        code === "ETIMEDOUT"
          ? `${GH_BIN} did not answer within ${String(GH_TIMEOUT_MS)}ms`
          : `${GH_BIN} could not be started (${out.error.message})`,
    };
  }
  if (out.status === null) {
    return {
      status: null,
      stdout: String(out.stdout ?? ""),
      stderr: String(out.stderr ?? ""),
      spawnError: "ETIMEDOUT",
      problem: `${GH_BIN} was killed by a signal (${String(out.signal)}) before it could answer`,
    };
  }
  return { status: out.status, stdout: String(out.stdout ?? ""), stderr: String(out.stderr ?? "") };
}

/**
 * What a value IS, in one word, for a shape complaint that is worth
 * reading.
 *
 * @param {unknown} v
 * @returns {string}
 */
function describe(v) {
  if (v === null) return "null";
  if (Array.isArray(v)) return "an array";
  if (typeof v === "object") return "an object";
  return `a ${typeof v}`;
}

/**
 * Read `gh run list --json`'s answer, or say why it cannot be read.
 *
 * REFUSES RATHER THAN GUESSES, which is this card's fourth criterion and
 * the ONE place this arm inverts the header's fail-open doctrine. The
 * strictness is spent on `RUN_LIST_REQUIRED_FIELDS` and nowhere else: a
 * missing `status` leaves this guard unable to tell a running job from a
 * finished one, and the guess it would have to make — *"probably nothing
 * is in flight"* — is precisely the state the arm exists to catch. Extra
 * fields are fine; a CLI is allowed to grow.
 *
 * @param {string} text
 * @returns {{ runs: Run[] } | { problem: string }}
 */
export function parseRunList(text) {
  /** @type {unknown} */
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch (err) {
    return {
      problem: `\`${GH_BIN} run list --json\` printed something that is not JSON (${
        err instanceof Error ? err.message : String(err)
      })`,
    };
  }
  if (!Array.isArray(parsed)) {
    return {
      problem: `\`${GH_BIN} run list --json\` answered ${describe(parsed)} where this guard asked for an array of runs`,
    };
  }
  /** @type {Run[]} */
  const runs = [];
  for (let i = 0; i < parsed.length; i += 1) {
    /** @type {unknown} */
    const row = parsed[i];
    if (row === null || typeof row !== "object" || Array.isArray(row)) {
      return { problem: `run ${String(i)} of the run list is ${describe(row)} and not an object` };
    }
    const obj = /** @type {Record<string, unknown>} */ (row);
    for (const field of RUN_LIST_REQUIRED_FIELDS) {
      if (!(field in obj)) {
        return {
          problem: `run ${String(i)} of the run list carries no \`${field}\`, and this guard's verdict rests on it`,
        };
      }
    }
    // THE EMPTY STRING IS A VALID `conclusion` AND IS THE COMMONEST ONE
    // THIS ARM MEETS: a run that is still going has not concluded. A
    // non-empty check here would reject every live run, which — under
    // the refuse-on-unreadable rule above — would turn this arm's
    // announced allow into a hard block on exactly the state it exists
    // to catch.
    for (const field of ["status", "conclusion"]) {
      if (typeof obj[field] !== "string") {
        return {
          problem: `run ${String(i)} of the run list answers \`${field}\` with ${describe(obj[field])} and not a string`,
        };
      }
    }
    const id = obj["databaseId"];
    if (typeof id !== "number" && typeof id !== "string") {
      return {
        problem: `run ${String(i)} of the run list answers \`databaseId\` with ${describe(id)}`,
      };
    }
    /** @param {string} field @returns {string} */
    const optional = (field) => (typeof obj[field] === "string" ? /** @type {string} */ (obj[field]) : "");
    runs.push({
      id: String(id),
      status: /** @type {string} */ (obj["status"]),
      conclusion: /** @type {string} */ (obj["conclusion"]),
      headSha: optional("headSha"),
      startedAt: optional("startedAt"),
      createdAt: optional("createdAt"),
      url: optional("url"),
      title: optional("displayTitle"),
    });
  }
  return { runs };
}

/**
 * THE NEWEST RUN THAT ACTUALLY SAID SOMETHING, and how many it skipped.
 *
 * Not `runs.find(r => r.status === "completed")`, and the difference is
 * this card's own instance rather than a refinement. `ci.yml` sets
 * `cancel-in-progress: true`, so a batch of rapid pushes leaves a stack
 * of `cancelled` runs that are completed and mean nothing — measured two
 * to one against `failure` over this repository's last sixty runs. The
 * skipped COUNT is returned rather than discarded because it is the
 * batching rule's own footprint: a seat told it is skipping four
 * cancelled runs has been told it superseded four runs.
 *
 * @param {Run[]} runs
 * @returns {{ run: Run, skipped: number } | undefined}
 */
export function newestVerdictRun(runs) {
  let skipped = 0;
  for (const run of runs) {
    if (run.status !== COMPLETED_RUN_STATUS) continue;
    if (NON_VERDICT_CONCLUSIONS.includes(run.conclusion)) {
      skipped += 1;
      continue;
    }
    return { run, skipped };
  }
  return undefined;
}

/**
 * WHY DID `gh` FAIL, to the extent it can be told?
 *
 * Three named cases and one disclosed unknown. All four ALLOW — this
 * card's third criterion — and the split is not decoration: an
 * unrecognised failure is the bucket that would otherwise hide a
 * misspelled `--json` field, which is a defect in THIS FILE reported as
 * a benign limit in somebody else's network.
 *
 * @param {CheckResult} result
 * @returns {{ kind: string, sentence: string }}
 */
export function classifyGhFailure(result) {
  const err = String(result.stderr ?? "").trim();
  if (result.status === null) {
    const absent = (result.spawnError ?? "") === "ENOENT";
    return {
      kind: absent ? "absent" : "did-not-answer",
      sentence: absent
        ? `\`${GH_BIN}\` is not on this PATH`
        : (result.problem ?? `\`${GH_BIN}\` did not answer`),
    };
  }
  if (result.status === GH_EXIT.UNAUTHENTICATED) {
    return { kind: "unauthenticated", sentence: `\`${GH_BIN}\` is not authenticated (exit 4)` };
  }
  if (GH_NO_GITHUB_REMOTE_RE.test(err)) {
    return {
      kind: "no-github-remote",
      sentence: "this checkout's remotes point at no GitHub repository, so there is no CI to ask about",
    };
  }
  return {
    kind: "unrecognised",
    sentence:
      `\`${GH_BIN}\` exited ${String(result.status)}, WHICH THIS GUARD CANNOT INTERPRET — that code ` +
      "covers a dead network, an HTTP 404, and a mistake in the arguments this guard itself sent",
  };
}

/**
 * @typedef {object} Step
 * @property {string} job
 * @property {string} name
 */

/**
 * Read `gh run view --json jobs`'s answer, or say why it cannot be read.
 *
 * The same rule as `parseRunList` and the same reason, applied to a
 * nested shape: a job is unreadable if its `steps` is not a list of
 * objects carrying a `name` and a `conclusion`.
 *
 * @param {string} text
 * @returns {{ jobs: { name: string, conclusion: string, steps: { name: string, conclusion: string }[] }[] } | { problem: string }}
 */
export function parseRunJobs(text) {
  /** @type {unknown} */
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch (err) {
    return {
      problem: `\`${GH_BIN} run view --json jobs\` printed something that is not JSON (${
        err instanceof Error ? err.message : String(err)
      })`,
    };
  }
  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
    return {
      problem: `\`${GH_BIN} run view --json jobs\` answered ${describe(parsed)} where this guard asked for an object`,
    };
  }
  const jobsRaw = /** @type {Record<string, unknown>} */ (parsed)["jobs"];
  if (!Array.isArray(jobsRaw)) {
    return { problem: `the run's \`jobs\` is ${describe(jobsRaw)} and not an array` };
  }
  /** @type {{ name: string, conclusion: string, steps: { name: string, conclusion: string }[] }[]} */
  const jobs = [];
  for (let i = 0; i < jobsRaw.length; i += 1) {
    /** @type {unknown} */
    const row = jobsRaw[i];
    if (row === null || typeof row !== "object" || Array.isArray(row)) {
      return { problem: `job ${String(i)} is ${describe(row)} and not an object` };
    }
    const obj = /** @type {Record<string, unknown>} */ (row);
    if (typeof obj["name"] !== "string" || typeof obj["conclusion"] !== "string") {
      return { problem: `job ${String(i)} carries no readable \`name\` and \`conclusion\`` };
    }
    const stepsRaw = obj["steps"];
    if (!Array.isArray(stepsRaw)) {
      return { problem: `job ${String(i)}'s \`steps\` is ${describe(stepsRaw)} and not an array` };
    }
    /** @type {{ name: string, conclusion: string }[]} */
    const steps = [];
    for (let k = 0; k < stepsRaw.length; k += 1) {
      /** @type {unknown} */
      const s = stepsRaw[k];
      if (s === null || typeof s !== "object" || Array.isArray(s)) {
        return { problem: `step ${String(k)} of job ${String(i)} is ${describe(s)} and not an object` };
      }
      const so = /** @type {Record<string, unknown>} */ (s);
      if (typeof so["name"] !== "string" || typeof so["conclusion"] !== "string") {
        return {
          problem: `step ${String(k)} of job ${String(i)} carries no readable \`name\` and \`conclusion\``,
        };
      }
      steps.push({
        name: /** @type {string} */ (so["name"]),
        conclusion: /** @type {string} */ (so["conclusion"]),
      });
    }
    jobs.push({
      name: /** @type {string} */ (obj["name"]),
      conclusion: /** @type {string} */ (obj["conclusion"]),
      steps,
    });
  }
  return { jobs };
}

/**
 * The first step that failed, named with the job it failed in.
 *
 * A job whose conclusion is `failure` but whose steps name none — a
 * runner that died, a job cancelled mid-step — yields the JOB with no
 * step rather than nothing at all, because *"the linux job failed and
 * this guard cannot say where"* is still worth the seat's second.
 *
 * @param {{ name: string, conclusion: string, steps: { name: string, conclusion: string }[] }[]} jobs
 * @returns {Step | undefined}
 */
export function failingStep(jobs) {
  for (const job of jobs) {
    if (job.conclusion !== FAILED_CONCLUSION) continue;
    const step = job.steps.find((s) => s.conclusion === FAILED_CONCLUSION);
    return { job: job.name, name: step === undefined ? "" : step.name };
  }
  return undefined;
}

/**
 * WHICH PACKAGE WAS THAT STEP TESTING? — read out of the workflow.
 *
 * A line scanner rather than a YAML parser, because this hook's
 * dependency budget is node builtins and a lane worktree ninety seconds
 * old has no `node_modules`. The shape it reads is the only one it
 * claims: a sequence item whose first key is `name:`, and a
 * `working-directory:` indented under that same item. Anything else
 * returns `undefined`, which the caller SAYS rather than guesses past.
 *
 * A step with no `working-directory` runs at the repository root, and
 * `reachesPackage` treats that as reached by every push — which is true
 * and is the honest answer rather than a convenient one.
 *
 * @param {string} workflowText
 * @param {string} stepName
 * @returns {string | undefined}
 */
export function stepWorkingDirectory(workflowText, stepName) {
  if (stepName === "") return undefined;
  let inStep = false;
  let itemIndent = -1;
  for (const line of workflowText.split("\n")) {
    const item = /^(\s*)-\s+(\S.*)$/.exec(line);
    if (item !== null) {
      const named = /^name:\s*(.*)$/.exec(/** @type {string} */ (item[2]));
      inStep = named !== null && yamlScalar(/** @type {string} */ (named[1])) === stepName;
      itemIndent = /** @type {string} */ (item[1]).length;
      continue;
    }
    if (!inStep) continue;
    const key = /^(\s*)(\S+):\s*(.*)$/.exec(line);
    if (key === null) continue;
    if (/** @type {string} */ (key[1]).length <= itemIndent) {
      inStep = false;
      continue;
    }
    if (key[2] === "working-directory") return yamlScalar(/** @type {string} */ (key[3]));
  }
  return undefined;
}

/**
 * A plain YAML scalar, unquoted and trimmed. Nothing cleverer: the
 * workflow this reads writes plain scalars, and a value this cannot read
 * makes the step unplaceable, which is a sentence and never a verdict.
 *
 * @param {string} raw
 * @returns {string}
 */
function yamlScalar(raw) {
  const v = raw.trim();
  if (v.length >= 2 && ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'")))) {
    return v.slice(1, -1);
  }
  return v;
}

/**
 * The paths this push carries SINCE the run that failed.
 *
 * THE LEFT-HAND END IS THE FAILED RUN'S OWN `headSha`, which is what
 * makes this question answerable at all: the run tells us which commit
 * it measured, so *"does this push reach that package"* needs no guess
 * about upstreams, tracking refs or which remote a `git push` names.
 * A sha this checkout does not have is SAID to be missing rather than
 * substituted for.
 *
 * @param {string} root
 * @param {string} sha
 * @returns {{ paths: string[] } | { problem: string }}
 */
export function pathsSince(root, sha) {
  /** @type {ReturnType<typeof spawnSync>} */
  let out;
  try {
    out = spawnSync("git", ["diff", "--name-only", sha, "HEAD"], {
      cwd: root,
      encoding: "utf8",
      maxBuffer: 32 * 1024 * 1024,
    });
  } catch (err) {
    return { problem: `git could not be started (${err instanceof Error ? err.message : String(err)})` };
  }
  if ((out.error !== undefined && out.error !== null) || out.status !== 0) {
    const first = String(out.stderr ?? "").trim().split("\n")[0] ?? "";
    return {
      problem: `git would not diff ${sha}..HEAD in this checkout (${
        first !== "" ? first : `exit ${String(out.status)}`
      })`,
    };
  }
  return {
    paths: String(out.stdout ?? "")
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l !== ""),
  };
}

/**
 * Does any of these paths lie inside that package?
 *
 * A step with no working directory of its own runs at the repository
 * root, and every push reaches the repository root — stated as `true`
 * rather than as an absence, because the caller's sentence differs.
 *
 * @param {string[]} paths
 * @param {string | undefined} dir
 * @returns {boolean}
 */
export function reachesPackage(paths, dir) {
  if (dir === undefined || dir === "" || dir === ".") return true;
  const norm = dir.replace(/\/+$/, "");
  return paths.some((p) => p === norm || p.startsWith(`${norm}/`));
}

/**
 * Every run id this command line, or this hook's own environment,
 * acknowledges.
 *
 * READ FROM THE PUSH'S OWN SEGMENT AND ONLY BEFORE THE WORD `git`, which
 * is what an environment PREFIX is. `echo NPUTER_CANCEL_CI=1 && git push`
 * does not acknowledge anything, and neither does a `--message` that
 * happens to quote the name. The process environment is read too, because
 * a human running a session with the variable exported is making the same
 * statement — and it is safe to honour precisely because the VALUE must
 * be the live run's id, so an exported acknowledgement expires by itself.
 *
 * @param {string} command
 * @param {Record<string, string | undefined>} env
 * @returns {string[]}
 */
export function acknowledgedRunIds(command, env) {
  /** @type {string[]} */
  const values = [];
  const fromEnv = env[CANCEL_CI_ENV];
  if (typeof fromEnv === "string" && fromEnv.trim() !== "") values.push(fromEnv.trim());
  const pushSegments = new Set(
    gitInvocations(command)
      .filter(
        (inv) =>
          inv.subcommand === "push" && !inv.tokens.some((t) => NON_PUSHING_FLAGS.includes(t)),
      )
      .map((inv) => inv.segment),
  );
  const segs = segments(command);
  for (const s of pushSegments) {
    const seg = segs[s];
    if (seg === undefined) continue;
    for (const tok of seg.tokens) {
      if (tok === "git") break;
      if (tok.startsWith(`${CANCEL_CI_ENV}=`)) values.push(tok.slice(CANCEL_CI_ENV.length + 1).trim());
    }
  }
  return values;
}

/**
 * When a run STARTED — `startedAt`, falling back to `createdAt`.
 *
 * **`updatedAt` IS NOT A CLOCK AND IS NOT HERE.** Measured: run
 * 33577276465 read `updatedAt` 00:55:14 while it was still genuinely
 * running at 01:02:13Z. An elapsed time derived from it would be wrong
 * by minutes and would stay perfectly plausible, which is the kind of
 * figure nobody ever checks.
 *
 * @param {Run} run
 * @returns {string}
 */
export function runStartedAt(run) {
  return run.startedAt !== "" ? run.startedAt : run.createdAt;
}

/**
 * How long ago, in words a refusal can carry.
 *
 * A LIVE FACT AND NOT A FUNCTION OF A TREE, so it is computed at the
 * moment of the refusal from a clock this guard is handed rather than
 * from one it reaches for — which is what lets a body pin it. An
 * unreadable or absent timestamp SAYS SO: the elapsed time is a sentence
 * and never a verdict, so it degrades rather than refusing.
 *
 * @param {string} iso
 * @param {number} nowMs
 * @returns {string}
 */
export function elapsedSince(iso, nowMs) {
  const started = Date.parse(iso);
  if (Number.isNaN(started)) return "an unreadable time";
  const secs = Math.max(0, Math.round((nowMs - started) / 1000));
  if (secs < 60) return `${String(secs)}s`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${String(mins)}m ${String(secs % 60)}s`;
  return `${String(Math.floor(mins / 60))}h ${String(mins % 60)}m`;
}

/**
 * THE CI ARM'S WHOLE DECISION.
 *
 * Returns a `block` only for a run that is still going and unacknowledged
 * or an answer whose shape this guard cannot read; everything else is
 * `undefined` — an allow — with whatever it had to say pushed onto
 * `notices`, which the runner prints whatever verdict the arms below then
 * reach. THAT PLACEMENT IS THE DESIGN: a red-CI announcement must survive
 * a push that the graph arm goes on to refuse, because the two facts are
 * about different machines.
 *
 * @param {string} root
 * @param {string | undefined} headRef
 * @param {string} command
 * @param {(root: string, argv: string[]) => CheckResult} gh
 * @param {string[]} notices
 * @param {Record<string, string | undefined>} env
 * @param {number} nowMs
 * @returns {Decision | undefined}
 */
export function ciVerdict(root, headRef, command, gh, notices, env, nowMs) {
  const branch = headRef === undefined ? undefined : /^refs\/heads\/(.+)$/.exec(headRef)?.[1];
  if (branch === undefined) {
    notices.push(
      `CI WAS NOT ASKED: ${root}'s HEAD names no branch (${headRef ?? "unreadable"}), and a CI run ` +
        "is looked up BY BRANCH. The push is allowed and the remote's state is UNVERIFIED.",
    );
    return undefined;
  }

  const argv = ghRunListArgv(branch);
  const listed = gh(root, argv);
  if (listed.status !== GH_EXIT.OK) {
    const why = classifyGhFailure(listed);
    notices.push(
      `CI WAS NOT ASKED (${why.kind}): ${why.sentence}.\n` +
        `${indent(listed.stderr || listed.stdout)}` +
        "  An inability is not a verdict, in either direction: nothing here has said a run is " +
        "finished, and nothing here has said one is not. The T-203 token above is a LOCAL " +
        "measurement and answers neither question — only one of the two machines is yours " +
        "(docs/CONVENTIONS.md, AND THEN READ IT).\n" +
        (why.kind === "unrecognised"
          ? "  THAT EXIT CODE MAY BE THIS GUARD'S OWN MISTAKE rather than your network — run the " +
            "exact command it sent and read the answer:\n"
          : "  Ask by hand:\n") +
        `    ${GH_BIN} ${argv.join(" ")}`,
    );
    return undefined;
  }
  const read = parseRunList(listed.stdout);
  if ("problem" in read) {
    return block(
      "ci-unreadable",
      `PUSH REFUSED: \`${GH_BIN}\` answered, and this guard cannot read the answer — ${read.problem}.\n` +
        "  This is the ONE place this arm refuses on something other than a running job, and it " +
        "is the token arm's rule rather than a new one: an unreadable answer is not an " +
        "unanswered question. To carry on, this guard would have to GUESS the shape, and the " +
        "guess that matters is `probably nothing is in flight` — which is exactly the state it " +
        "exists to catch.\n" +
        `  Ask by hand and compare: ${GH_BIN} ${ghRunListArgv(branch).join(" ")}`,
    );
  }
  const runs = read.runs;
  if (runs.length === 0) return undefined;
  const newest = /** @type {Run} */ (runs[0]);

  /** @type {Decision | undefined} */
  let verdict = undefined;
  if (ACTIVE_RUN_STATUSES.includes(newest.status)) {
    if (acknowledgedRunIds(command, env).includes(newest.id)) {
      notices.push(
        `CI RUN ${newest.id} IS ${newest.status.toUpperCase()} AND THIS PUSH WILL CANCEL IT — ` +
          `acknowledged by ${CANCEL_CI_ENV}=${newest.id}. It has been running for ` +
          `${elapsedSince(runStartedAt(newest), nowMs)} and the tree it was measuring gets no ` +
          "verdict.",
      );
    } else {
      verdict = block(
        "ci-run-in-flight",
        `PUSH REFUSED: CI run ${newest.id} for \`${branch}\` is ${newest.status} and this push ` +
          "would CANCEL it.\n" +
          (newest.title === "" ? "" : `    ${newest.title}\n`) +
          `    running for ${elapsedSince(runStartedAt(newest), nowMs)}` +
          (newest.headSha === "" ? "" : `, over ${newest.headSha.slice(0, 12)}`) +
          "\n" +
          (newest.url === "" ? "" : `    ${newest.url}\n`) +
          "  docs/CONVENTIONS.md: A PUSH CANCELS THE RUNNING CI JOB — BATCH THE PUSH. The tree " +
          "that run is measuring never gets a verdict, which is how a red main is discovered two " +
          "pushes late: four runs were superseded this way on 2026-09-01 and main sat red for " +
          "roughly five hours.\n" +
          "  A GREEN LOCAL BATTERY IS NOT THIS MEASUREMENT. Only one of the two machines is " +
          "yours, so the T-203 token this guard just accepted says nothing about this run.\n" +
          "  Wait for it, then push:\n" +
          `    ${GH_BIN} run watch ${newest.id}\n` +
          "  Or cancel it knowingly, by naming the run you are cancelling:\n" +
          `    ${CANCEL_CI_ENV}=${newest.id} git push …\n` +
          "  That is not an override flag — this guard ships none. It names ONE RUN, so it " +
          "cannot outlive the run it was for: the next run has a different id.",
      );
    }
  } else if (newest.status !== COMPLETED_RUN_STATUS) {
    notices.push(
      `CI'S NEWEST RUN WAS NOT JUDGED: run ${newest.id} for \`${branch}\` reports status ` +
        `\`${newest.status}\`, which is neither \`${COMPLETED_RUN_STATUS}\` nor one of the ` +
        `statuses this guard knows to mean RUNNING (${ACTIVE_RUN_STATUSES.join(", ")}). The push ` +
        "is allowed and whether it cancels anything is UNVERIFIED.",
    );
  }

  // ── WHAT DID CI LAST ACTUALLY SAY? ─────────────────────────────────
  // NOT the newest COMPLETED run, which under `cancel-in-progress: true`
  // is usually a run that was superseded and reached nothing. See
  // `newestVerdictRun`: this card's own instance sat behind exactly such
  // a stack.
  const last = newestVerdictRun(runs);
  if (last !== undefined) {
    const skipped =
      last.skipped === 0
        ? ""
        : `  ${String(last.skipped)} newer run(s) reached NO verdict (${NON_VERDICT_CONCLUSIONS.filter(
            (c) => c !== "",
          ).join("/")}) and were skipped to find it — \`cancel-in-progress: true\` means a ` +
          "superseded push leaves one behind, which is the habit this guard is here for.\n";
    if (last.run.conclusion === FAILED_CONCLUSION) {
      notices.push(ciFailureNotice(root, last.run, branch, gh, skipped));
    } else if (last.run.conclusion !== "success") {
      notices.push(
        `CI'S LAST VERDICT WAS NOT READ: run ${last.run.id} for \`${branch}\` concluded ` +
          `\`${last.run.conclusion}\`, which this guard reads as neither \`success\` nor ` +
          `\`${FAILED_CONCLUSION}\`. Look at it yourself: ${GH_BIN} run view ${last.run.id}\n` +
          skipped,
      );
    }
    // A `success` IS SILENT, skipped runs and all. This file's rule: an
    // ORDINARY allow says nothing. The skipped count is context for a
    // verdict worth acting on, and a line printed on every green push is
    // a line nobody reads by the third one.
  }
  return verdict;
}

/**
 * The announcement a red CI earns — and it is an announcement, by this
 * card's second criterion, because pushing over a red is the ORDINARY
 * way a red gets fixed and a refusal here would block the remedy.
 *
 * @param {string} root
 * @param {Run} run
 * @param {string} branch
 * @param {(root: string, argv: string[]) => CheckResult} gh
 * @param {string} skipped  the superseded-run sentence, or ``
 * @returns {string}
 */
function ciFailureNotice(root, run, branch, gh, skipped) {
  const head =
    `CI IS RED UNDER THIS PUSH: run ${run.id} for \`${branch}\` concluded ` +
    `\`${FAILED_CONCLUSION}\`` +
    (run.headSha === "" ? "" : ` over ${run.headSha.slice(0, 12)}`) +
    (run.title === "" ? "" : ` — ${run.title}`) +
    "\n" +
    skipped;
  const tail =
    (run.url === "" ? "" : `    ${run.url}\n`) +
    "  THIS IS NOT A REFUSAL: pushing over a red is how a red gets fixed. It is said because a " +
    "local battery and CI are different measurements, and this one has already failed " +
    "(docs/CONVENTIONS.md, AND THEN READ IT).\n" +
    `    ${GH_BIN} run view ${run.id} --log-failed`;

  const viewed = gh(root, ghRunViewArgv(run.id));
  if (viewed.status !== 0) {
    return (
      head +
      `  the failing step could not be read: ${
        viewed.problem ?? `\`${GH_BIN}\` exited ${String(viewed.status)}`
      }\n` +
      tail
    );
  }
  const jobs = parseRunJobs(viewed.stdout);
  if ("problem" in jobs) return `${head}  the failing step could not be read: ${jobs.problem}\n${tail}`;
  const step = failingStep(jobs.jobs);
  if (step === undefined) {
    return `${head}  no job in that run reports a \`${FAILED_CONCLUSION}\` conclusion\n${tail}`;
  }
  const where = step.name === "" ? `job \`${step.job}\`` : `\`${step.job}\` / \`${step.name}\``;
  return `${head}  failing step: ${where}\n${reachSentence(root, run, step)}${tail}`;
}

/**
 * DOES THE TREE BEING PUSHED REACH THAT STEP'S PACKAGE?
 *
 * Two derivations, either of which can decline: the step's package comes
 * out of the repository's OWN workflow file, and the paths come out of
 * `git diff` against the commit that run measured. Where either declines
 * the sentence SAYS which one did — a guard that answered "no" because it
 * could not look would be telling the seat something false about its own
 * tree, which is the discrimination `token-unmeasured` exists to make one
 * arm up.
 *
 * @param {string} root
 * @param {Run} run
 * @param {Step} step
 * @returns {string}
 */
function reachSentence(root, run, step) {
  if (run.headSha === "") {
    return `    whether this push reaches that step's package is UNKNOWN: the run named no headSha\n`;
  }
  /** @type {string} */
  let workflow;
  try {
    workflow = readFileSync(path.join(root, CI_WORKFLOW_REL_PATH), "utf8");
  } catch {
    return `    that step's package is unknown here: ${root} carries no readable ${CI_WORKFLOW_REL_PATH}\n`;
  }
  const dir = stepWorkingDirectory(workflow, step.name);
  const pkg =
    dir === undefined || dir === "" ? undefined : dir.replace(/\/+$/, "");
  const paths = pathsSince(root, run.headSha);
  if ("problem" in paths) {
    return (
      `    that step runs in ${pkg === undefined ? "the repository root" : `${pkg}/`}, and whether ` +
      `this push reaches it is UNKNOWN: ${paths.problem}\n`
    );
  }
  if (pkg === undefined) {
    return (
      `    ${CI_WORKFLOW_REL_PATH} gives that step no \`working-directory\`, so it runs at the ` +
      `repository root and EVERY push reaches it (${String(paths.paths.length)} path(s) changed ` +
      `since ${run.headSha.slice(0, 12)})\n`
    );
  }
  const reaches = reachesPackage(paths.paths, pkg);
  return (
    `    that step runs in ${pkg}/, and this push ${reaches ? "DOES" : "does NOT"} change anything ` +
    `under it (${String(paths.paths.length)} path(s) changed since ${run.headSha.slice(0, 12)})` +
    (reaches ? " — you are pushing a fix\n" : " — main is red under work that is not this\n")
  );
}

/**
 * Is the working tree dirty, and in what?
 *
 * READ THE CONTRACT: this reaches NO verdict and cannot change one. It
 * exists so a refusal can tell the seat WHICH remedy applies, because
 * `index --check` asks about the WORKING TREE while a push carries
 * COMMITS — so a tree with uncommitted edits to indexed files can be
 * STALE for a push whose commits are current. That is the one case this
 * card considered an escape hatch for and refused to ship one for; the
 * substitute is a refusal that names `git stash` beside the regen, which
 * needs this answer and nothing else from it.
 *
 * A FAILURE HERE IS SILENCE, NEVER A VERDICT. If git cannot be run the
 * refusal simply loses a sentence.
 *
 * @param {string} root
 * @returns {boolean}
 */
export function dirtyTree(root) {
  try {
    const out = spawnSync("git", ["status", "--porcelain"], {
      cwd: root,
      encoding: "utf8",
      maxBuffer: 8 * 1024 * 1024,
    });
    if (out.status !== 0) return false;
    return String(out.stdout ?? "").trim() !== "";
  } catch {
    return false;
  }
}

/**
 * @typedef {object} Request
 * @property {string} [toolName]
 * @property {Record<string, unknown>} [toolInput]
 * @property {string} [cwd]
 */

/**
 * The command a `Bash` tool call was made with, or `undefined`.
 *
 * @param {Record<string, unknown> | undefined} toolInput
 * @returns {string | undefined}
 */
export function commandOf(toolInput) {
  const v = toolInput?.["command"];
  return typeof v === "string" && v !== "" ? v : undefined;
}

/**
 * Can a lane regenerate the graph inside its own fence?
 *
 * THE SIXTH CRITERION SAYS TO DERIVE THIS RATHER THAN ASSUME IT, and the
 * derivation is one line because the answer is already computed and
 * stamped: the lane's manifest carries its expanded fence, so the
 * question is whether any fenced domain contains the graph. It almost
 * never does — a fence is a card's `touches:` and cards do not touch
 * `docs/architecture/` — which is the point. Refusing a push from a lane
 * that has no legal way to clear the refusal would leave that lane
 * stuck, and a guard with no remedy is a guard somebody disables.
 *
 * @param {import("./lane-fence.mjs").Manifest} manifest
 * @returns {boolean}
 */
export function laneCanRegenerate(manifest) {
  return manifest.paths.some((domain) => within(GRAPH_REL_PATH, domain));
}

/**
 * The whole decision.
 *
 * READ THE ORDER — every arm before the check is an ALLOW, and each one
 * is a question this guard can answer without spending a second and a
 * half. The check runs last and only for a command that really pushes,
 * in a checkout that really is this repository's, from a seat that could
 * really act on a refusal.
 *
 * ── TWO GUARDS, ONE DECISION, AND WHY THE SECOND ONE SPEAKS TWICE ────
 * T-212 adds THE LANDING GATE on the same hook — `T-207`'s precedent,
 * one hook, two arms, one artifact per meaning. Its REFUSAL returns
 * immediately, because a push carrying a path outside its fence must not
 * land whatever the graph says. Its CANNOT-COMPARE does not return at
 * all: it is collected as a NOTICE and said alongside whatever verdict
 * the graph check then reaches. Returning it would silently retire the
 * graph guard for every lane whose fence this hook cannot fully expand,
 * which is the shape where one guard quietly eats another.
 *
 * ── THREE ARMS NOW, AND THE ORDER IS THE DESIGN (T-203) ──────────────
 * The graph arm above is joined by the CHEAP CHECKS and the VERDICT
 * TOKEN, and both run BEFORE every arm that can return early — including
 * `lane-cannot-regenerate`, which is an allow. *"Unconditionally"* is
 * this card's own word and it is a claim about control flow, not about
 * intent: a check placed after an early allow is a check that does not
 * run for the seats that take it.
 *
 * They also run before the GRAPH check, which is the expensive one. A
 * push that is going to be refused for a dangling `blocked_by` should not
 * first spend a second and a half compiling a Rust crate to be told
 * something else.
 *
 * ── THE TOKEN ARM FAILS CLOSED, WHICH THE GRAPH ARM DOES NOT ─────────
 * Every other arm in this file allows when it cannot answer, and the
 * header above argues that at length. THE TOKEN IS THE EXCEPTION, BY THIS
 * CARD'S FIRST CRITERION AND NOT BY DRIFT: a missing token is not an
 * inability, it is the ABSENCE OF A MEASUREMENT, and allowing there would
 * make the guard vacuous — it would pass exactly the state it exists to
 * catch. The remedy is one command and the refusal prints it.
 *
 * What still fails OPEN is the guard's own inability to KEY the question:
 * a checkout whose `HEAD^{tree}` git will not name has no tree to compare
 * against, so there is nothing to be strict about, and that arm is
 * announced rather than silent.
 *
 * ── AND THE FALSE-POSITIVE COST ROSE, WHICH IS SAID RATHER THAN HIDDEN
 * `gitInvocations` is a whitespace scanner, and its header records that
 * `echo git push` and `man git push` reach the refusal. Under the graph
 * arm alone that cost was bounded by a real staleness the seat already
 * owed. Under the token arm it is not: a stray `git push` inside a quoted
 * string is refused whenever the battery has not been run against HEAD's
 * tree, which is most of the time. THE SCANNER IS NOT WIDENED OR
 * NARROWED HERE — it is a landed guard's and changing it is another
 * card's — but the new cost is stated so the next reader meets it in a
 * comment instead of in a refusal.
 *
 * ── AND A FOURTH ARM ASKS THE REMOTE (T-237) ────────────────────────
 * Placed AFTER every local arm and before the graph check, which is a
 * cost decision and a courtesy in one: a push already refused for a
 * dangling `blocked_by` or an unmeasured tree should not first spend a
 * network round trip to be told something else, and the two problems it
 * reports are the seat's to fix in either order. Its ANNOUNCEMENT is a
 * notice rather than a return, so a red CI reaches the seat whatever the
 * graph then says — the graph is about this machine and CI is not.
 *
 * @param {Request} request
 * @param {(root: string) => CheckResult} [check]
 * @param {(root: string) => CheckResult} [cheap]
 * @param {(root: string, argv: string[]) => CheckResult} [gh]
 * @returns {Decision}
 */
export function decide(request, check = runCheck, cheap = runCheapChecks, gh = runGh) {
  /** @type {string[]} */
  const notices = [];
  const decision = decideWith(request, check, cheap, gh, notices);
  return notices.length === 0 ? decision : { ...decision, notices };
}

/**
 * @param {Request} request
 * @param {(root: string) => CheckResult} check
 * @param {(root: string) => CheckResult} cheap
 * @param {(root: string, argv: string[]) => CheckResult} gh
 * @param {string[]} notices  collected, and attached by `decide`
 * @returns {Decision}
 */
function decideWith(request, check, cheap, gh, notices) {
  const command = commandOf(request.toolInput);
  if (command === undefined) {
    return allow(
      "no-command-to-read",
      `${request.toolName ?? "this tool"} was called with no command string this hook can read, ` +
        "and a guard that cannot see the command cannot claim it is not a push",
    );
  }
  if (!isPush(command)) {
    return allow("not-a-push", "this command line invokes no `git push`");
  }

  // ── WHICH CHECKOUT DOES THIS PUSH ACT ON? (T-216) ──────────────────
  // NOT `findCheckoutRoot(request.cwd)`, which is where the WRITER sits
  // and, in this project's dispatch shape, is the DISPATCHING checkout
  // for every lane. See `pushCwds` for the whole argument; the short
  // version is that this guard now roots on EVIDENCE — git's own `-C`,
  // or a fully determined `cd … &&` chain, or the writer's cwd when
  // nothing moved it — and where there is no evidence it judges NOTHING
  // rather than judging a tree the push does not carry.
  const cwd = typeof request.cwd === "string" && request.cwd !== "" ? request.cwd : process.cwd();
  const resolved = pushCwds(command, cwd);
  if ("unresolved" in resolved) {
    // THE SIXTH CRITERION STILL HOLDS: outside this repository's own
    // checkouts the guard does not fire, and does not narrate either.
    // The writer's cwd cannot say where the push LANDS, but it can say
    // whether this seat is anywhere near this project — which is the
    // only question this arm needs it for.
    const writerRoot = findCheckoutRoot(cwd);
    const ours =
      writerRoot !== undefined &&
      existsSync(path.join(writerRoot, INDEX_CRATE_MANIFEST_REL_PATH));
    if (!ours) {
      return allow(
        "push-repository-unresolved-outside",
        `this push's repository could not be identified (${resolved.unresolved}) and ${cwd} is ` +
          "not in one of this repository's checkouts either, so there is nothing here to say",
      );
    }
    return allow(
      "push-repository-unresolved",
      "NOTHING ABOUT THIS PUSH WAS JUDGED: this guard could not identify the repository it acts " +
        `on — ${resolved.unresolved}.\n` +
        "  A push names no target the way a write does, so this guard reads only what the text " +
        "DETERMINES: a `-C`, or a `cd <literal>` chained to the push with `&&`, or an unmoved " +
        "working directory. It will not guess the rest, because the guess it used to make was " +
        `${cwd} — the seat's own directory — and judging the wrong tree is how a green verdict ` +
        "gets attached to a stale push (T-216).\n" +
        "  The graph, the board, the fence and the verdict token are ALL UNVERIFIED for this " +
        "push. Spell it so this guard can read it, and it is judged exactly:\n" +
        "    git -C <the checkout being pushed> push",
    );
  }
  const pushCwd = /** @type {string} */ (resolved.dirs[0]);
  const root = findCheckoutRoot(pushCwd);
  if (root === undefined) {
    return allow("not-a-repository", `${pushCwd} sits in no git checkout`);
  }
  if (!existsSync(path.join(root, INDEX_CRATE_MANIFEST_REL_PATH))) {
    return allow(
      "not-this-repository",
      `${root} carries no ${INDEX_CRATE_MANIFEST_REL_PATH}, so \`index --check\` is not a question ` +
        "that can be asked here (this card's sixth criterion: the guard does not fire outside " +
        "this repository's own checkouts)",
    );
  }

  // ── A VERDICT ABOUT SOMEWHERE ELSE SAYS SO (T-216) ─────────────────
  // Before this card the judged tree was ALWAYS the seat's own, so every
  // refusal below could say "this checkout" and be right. Now it can be
  // a lane the seat merely named, and the same sentences would be read
  // against the wrong directory by the person reading them. So the one
  // fact that changed is stated, and ONLY when it actually differs —
  // the ordinary push, where the seat pushes its own checkout, stays
  // silent, which is this file's rule for an ordinary allow.
  const writerRoot = findCheckoutRoot(cwd);
  if (writerRoot === undefined || !sameDirectory(writerRoot, root)) {
    notices.push(
      `THIS PUSH IS JUDGED IN ${root}, NOT IN ${cwd}. Every sentence below — the graph, the ` +
        "board, the fence, the verdict token — is about that tree, because that is the tree the " +
        "push carries (T-216).",
    );
  }

  const headRef = readHeadRef(root);
  const onLane = headRef !== undefined && LANE_BRANCH_RE.test(headRef);
  if (onLane) {
    // THE LANDING GATE FIRST, AND BEFORE THE MANIFEST IS EVEN OPENED
    // (T-212). It reads no manifest by construction — its fence comes off
    // the card as committed on the integration branch — so the arms below
    // cannot decide it.
    const landing = laneLandingVerdict(root, /** @type {string} */ (headRef));
    if (landing.verdict === "block") return landing;
    if (ANNOUNCED_ALLOW_CODES.includes(landing.code)) notices.push(landing.reason);
  } else if (headRef === `refs/heads/${INTEGRATION_BRANCH}`) {
    // THE OTHER MOMENT A PATH CAN LAND (T-212): a merge arriving on the
    // integration branch. The push arm above never sees it — the lane
    // that wrote it may have been refused, fixed, and merged by a seat
    // that is not on a lane branch at all.
    const landing = mergeLandingVerdict(root, headRef);
    if (landing.verdict === "block") return landing;
    if (ANNOUNCED_ALLOW_CODES.includes(landing.code)) notices.push(landing.reason);
  }

  // ── THE CHEAP CHECKS (T-203), UNCONDITIONALLY ──────────────────────
  // Ahead of the lane arms below, which can ALLOW and return, and ahead
  // of the graph check, which costs a second and a half.
  const cheapResult = cheap(root);
  if (cheapResult.status === null) {
    notices.push(
      `THE CHEAP CHECKS WERE NOT RUN: ${cheapResult.problem ?? "they did not run"}. Nothing here ` +
        "has said this push's board is coherent — an inability is not a verdict, in either " +
        "direction. Ask them by hand: node tools/e2e/scripts/push-checks.mjs",
    );
  } else if (cheapResult.status === CHEAP_CHECKS_EXIT.FOUND) {
    return block(
      "cheap-checks-found",
      "PUSH REFUSED: the cheap pre-push checks FOUND something. Each of these fired on this " +
        "project AFTER the commit that created it, and each one reached a push.\n" +
        "  their own report follows, VERBATIM:\n" +
        `${indent(cheapResult.stderr || cheapResult.stdout)}` +
        "  These run on every push regardless of the verdict token, and there is no override " +
        "flag: they cost milliseconds, and every remedy is an edit the seat was already going " +
        "to make.",
    );
  } else if (cheapResult.status !== CHEAP_CHECKS_EXIT.CLEAN) {
    notices.push(
      `THE CHEAP CHECKS DID NOT ANSWER: push-checks.mjs exited ${cheapResult.status}, which is ` +
        `${cheapResult.status === CHEAP_CHECKS_EXIT.USAGE ? "`called wrong`" : "`they could not run`"}` +
        " and never a finding. The push is allowed and the board is UNJUDGED.\n" +
        `${indent(cheapResult.stderr || cheapResult.stdout)}`,
    );
  }

  // ── THE VERDICT TOKEN (T-203) ──────────────────────────────────────
  // The only arm in this file that refuses on an ABSENCE. See `decide`.
  const tree = headTree(root);
  if (tree === undefined) {
    notices.push(
      `THE VERDICT TOKEN WAS NOT CHECKED: git would not name ${root}'s HEAD tree, so there is no ` +
        "key to compare a token against. The push is allowed and the graded suites are " +
        "UNVERIFIED.",
    );
  } else {
    const read = readToken(root);
    const judgement = judgeToken({
      ...("token" in read ? { token: read.token } : { problem: read.problem }),
      tree,
    });
    if (judgement.state !== "fresh") {
      return block(
        judgement.code,
        `PUSH REFUSED: ${judgement.detail}.\n` +
          "  A push is a claim that the gates were run. This guard is what makes that a FACT " +
          "rather than a claim — three commits landed on this project in one night after a gate " +
          "that had already failed, each time because the exit was read AFTER the commit.\n" +
          "  Run the blessed gate-runner from the repository root, then push:\n" +
          "    node tools/e2e/scripts/gate-run.mjs --all\n" +
          `  It writes ${TOKEN_REL_PATH}, keyed by the tree it ran against. RUN IT LAST: a commit ` +
          "made after a green run changes the tree and stales the token, which is the honest " +
          "answer rather than an inconvenience.\n" +
          "  There is no override flag, deliberately — T-167-s8 shipped its guard without one " +
          "and this card was told to follow that unless a measured reason appeared. None did.",
      );
    }
    // A FRESH TOKEN IS SILENT. This file's own rule: an ORDINARY allow
    // says nothing, and only an allow that left something UNVERIFIED
    // announces itself. A line on every good push is a line nobody reads
    // by the third one.
  }

  // ── THE RUN THAT IS ALREADY RUNNING (T-237) ────────────────────────
  // The first arm in this file that asks a machine which is not this
  // one. It returns a verdict only for a live run or an unreadable
  // answer; everything else it has to say goes into `notices`, so a red
  // CI is heard even when the graph then refuses.
  const ci = ciVerdict(root, headRef, command, gh, notices, process.env, Date.now());
  if (ci !== undefined) return ci;

  // ── CAN THIS LANE EVEN CLEAR A GRAPH REFUSAL? ──────────────────────
  // Both arms are about the GRAPH CHECK and nothing else, so they sit
  // beside it rather than up with the landing gate (T-203 moved them; the
  // verdict each reaches for each input is unchanged).
  if (onLane) {
    const read = readManifest(root);
    if ("problem" in read) {
      return allow(
        "lane-fence-unreadable",
        `${root} is on the lane branch ${String(headRef)} and its fence manifest could not be ` +
          `read (${read.problem}), so this guard cannot derive whether the lane could regenerate ` +
          "the graph inside its fence — and an unanswerable question is an allow here, not a " +
          "refusal",
      );
    }
    if (!laneCanRegenerate(read.manifest)) {
      return allow(
        "lane-cannot-regenerate",
        `${read.manifest.taskId}'s fence (${read.manifest.touchesLine}) does not reach ` +
          `${GRAPH_REL_PATH}, so this lane cannot regenerate the graph inside it. Refusing here ` +
          "would leave the lane no legal remedy, and the regen is the integrator's at the merge " +
          "(docs/CONVENTIONS.md, GRAPH REGEN).",
      );
    }
  }

  const result = check(root);
  if (result.status === null) {
    return allow(
      "check-could-not-run",
      `THE GRAPH WAS NOT ASKED: ${result.problem ?? "the check did not run"}. The push is allowed ` +
        "because a check that could not run is not a claim that the graph is stale — but nothing " +
        "here has said the graph is current. Ask it by hand from " +
        `${CHECK_DIR_REL_PATH}/: cargo ${CHECK_ARGV.join(" ")}`,
    );
  }
  if (result.status === CHECK_EXIT.CURRENT) {
    return allow("graph-current", "`index --check` exited 0: the committed graph is current");
  }
  if (result.status !== CHECK_EXIT.STALE) {
    const meaning =
      result.status === CHECK_EXIT.USAGE
        ? "2, which is `called wrong` and never `stale`"
        : result.status === CHECK_EXIT.COULD_NOT_RUN
          ? "3, which is `the gate could not run` and never `stale`"
          : `${result.status}, which is outside the four codes this gate publishes`;
    return allow(
      "check-inconclusive",
      `THE GRAPH WAS NOT ASKED SUCCESSFULLY: \`index --check\` exited ${meaning}. Only exit ` +
        `${CHECK_EXIT.STALE} means STALE, and collapsing these would refuse every push made ` +
        "without a toolchain. The push is allowed and the graph is UNVERIFIED.\n" +
        `${indent(result.stdout || result.stderr)}`,
    );
  }

  const stash = dirtyTree(root)
    ? "\n  This working tree is DIRTY, and `index --check` asks about the WORKING TREE while a " +
      "push carries COMMITS — so if the staleness is uncommitted work, `git stash` then push, " +
      "then `git stash pop`. If it is committed, regenerate."
    : "";
  return block(
    "graph-stale",
    "PUSH REFUSED: `index --check` exited 1 — the committed graph is STALE.\n" +
      "  docs/STATE.md: ask the graph AGAIN after every write. This is that ask, made " +
      "mechanically because it was missed by hand four times (T-167-s8).\n" +
      "  the check's own report follows, VERBATIM — its `regenerate:` line is the check's, not " +
      "this guard's copy of it:\n" +
      `${indent(result.stdout || result.stderr)}` +
      `  then re-run the check from ${CHECK_DIR_REL_PATH}/ and push again:\n` +
      `    cargo ${CHECK_ARGV.join(" ")}` +
      stash +
      "\n  There is no override flag, deliberately (this card's fifth criterion): the one case " +
      "argued for one had a one-command remedy, and a hatch nobody needs is a hatch that gets " +
      "used.",
  );
}

/**
 * Quote a captured report without letting it impersonate this guard's
 * own sentences — every line moves right by two columns.
 *
 * @param {string} text
 * @returns {string}
 */
function indent(text) {
  const body = text.replace(/\s+$/, "");
  if (body === "") return "";
  return `${body
    .split("\n")
    .map((l) => `    ${l}`)
    .join("\n")}\n`;
}
