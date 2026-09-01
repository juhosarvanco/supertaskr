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
 * ── NOTHING BUT NODE BUILTINS AND THE HOOK BESIDE IT ─────────────────
 * The lane-fence hook's rule, for the lane-fence hook's reason: a lane
 * worktree ninety seconds old has no `node_modules` anywhere in it. The
 * lane facts this file needs — how a lane branch is spelled, where the
 * manifest lives, how to read one, what containment means — are
 * IMPORTED from `lane-fence.mjs` rather than re-spelled, because a rule
 * with two implementations is two chances to disagree (T-057).
 */

import { spawnSync } from "node:child_process";
import { existsSync, realpathSync, statSync } from "node:fs";
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
 * @param {Request} request
 * @param {(root: string) => CheckResult} [check]
 * @param {(root: string) => CheckResult} [cheap]
 * @returns {Decision}
 */
export function decide(request, check = runCheck, cheap = runCheapChecks) {
  /** @type {string[]} */
  const notices = [];
  const decision = decideWith(request, check, cheap, notices);
  return notices.length === 0 ? decision : { ...decision, notices };
}

/**
 * @param {Request} request
 * @param {(root: string) => CheckResult} check
 * @param {(root: string) => CheckResult} cheap
 * @param {string[]} notices  collected, and attached by `decide`
 * @returns {Decision}
 */
function decideWith(request, check, cheap, notices) {
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
