/**
 * THE FENCE AT THE MOMENT OF THE WRITE (T-154) — the decision half.
 *
 * `method/lane-protocol.md` rule 5 says an executor whose work reaches
 * outside its own `touches:` has found a dispatch error rather than a
 * licence. That was a discipline, and three logged incidents went through
 * it. This module makes it a PROPERTY of the write: a PreToolUse hook on
 * the file-writing tools asks this function, and the answer is what the
 * tool call is allowed to do.
 *
 * ── TWO SEATS, AND THE SECOND ONE ARRIVED WITH A RULING ──────────────
 * v1 armed on the WRITING session's own branch, so it blocked a lane
 * reaching OUT and never saw a seat with no lane reaching IN — which is
 * the shape of two of the three incidents T-154 cites. @human ruled on
 * 2026-08-30 that those writes are IN SCOPE (`T-154-s2`), so `decide` now
 * answers for two seats and the two are NOT the same rule:
 *
 *   A LANE answers from its OWN manifest, and every uncertainty is a
 *   REFUSAL. That half is v1 in every verdict but one: `readManifest`
 *   now REQUIRES `excluded`, so a manifest predating this card blocks
 *   with `no-manifest` where v1 allowed. No live manifest can hit it —
 *   the writer has always stamped the field — and it is stated because
 *   "unchanged to the byte" was the claim and is not quite true.
 *   A SEAT WITH NO LANE answers from EVERY LIVE LANE'S manifest, and
 *   every uncertainty is an ALLOW. A refusal here rests on a POSITIVE,
 *   readable reservation — never on a file this hook could not read.
 *
 * THE ASYMMETRY IS THE DESIGN AND NOT AN INCONSISTENCY. A lane can be
 * told to stop; the integration seat cannot, because stopping it stops
 * every dispatch, every merge and every checkpoint at once. So the seat
 * that may be refused fails closed and the seat that may not fails open,
 * and v1's load-bearing property survives in a wider form: a manifest is
 * consulted only for a checkout whose OWN HEAD is a lane branch, so a
 * stray manifest still locks nobody out of anything.
 *
 * ── THE ROOT COMES FROM THE TARGET, NOT FROM THE WRITER (T-199) ──────
 * v2 asked `findCheckoutRoot(request.cwd)` — where the WRITER SITS — and
 * that one line made the whole guard inert in the shape this project
 * actually dispatches. `method/lane-protocol.md` rule 3 REQUIRES a lane
 * worktree to be a SIBLING of the repository, and the dispatching seat
 * runs from a nested checkout under `.claude/worktrees/`; a subagent
 * inherits the dispatching session's project root, so every lane write
 * was "outside the checkout" and limit 2 allowed it UNJUDGED. Not
 * denied, not permitted-with-a-carve: NEVER EVALUATED. Seven lanes ran
 * one night believing this file enforced their fences and it enforced
 * nothing; their compliance was DISCIPLINE, and a lane that drilled its
 * own fence is the only reason anybody found out (T-190, then T-199).
 *
 * MEASURED AT THE LIVE CONFIGURATION BEFORE THE CHANGE, dispatching seat
 * at `<repo>/.claude/worktrees/<name>` and lane at `../nputer-T-199`:
 * writes to that lane's `docs/ROADMAP.md`, `app/src/main.tsx`,
 * `docs/NORTH_STAR.md` and `.claude/hooks/lane-fence.mjs` — three of the
 * four far outside its `touches: [.claude, tools/e2e]` — ALL FOUR
 * allowed, code `outside-the-checkout`.
 *
 * SO `decide` NOW RESOLVES THE **TARGET PATH'S** REPOSITORY and applies
 * THAT repository's fences, wherever the writer happens to sit. A write
 * into `…/nputer-T-NNN/x` is judged by the lane living there because the
 * TARGET belongs to it — which is what limit 2's own intent (*"do not
 * police unrelated files on the machine"*) actually wanted all along.
 * The writer's cwd keeps exactly one job: resolving a RELATIVE target,
 * and answering a request that carries no path at all (limit 8).
 *
 * AND THE COST IS IN LIMIT 2 BELOW rather than buried: a write into a
 * lane's tree is now judged by THAT LANE'S fence whoever is writing, so
 * an architect reaching into a live lane meets the same rule as that
 * lane's own executor. The hook still has no term separating the two —
 * but the design this replaces allowed BOTH unconditionally, so every
 * write this tightens was previously UNJUDGED and none was previously
 * refused.
 *
 * ── ZERO DEPENDENCIES, AND THAT IS THE WHOLE DESIGN ──────────────────
 * The first draft of this card expanded the fence AT HOOK TIME through
 * `@nputer/parser`, which cannot work: a fresh lane worktree has nothing
 * installed and nothing built (docs/CONVENTIONS.md, "A FRESH WORKTREE HAS
 * NOTHING INSTALLED AND NOTHING BUILT"), so a fail-closed hook needing
 * `lib/parser/dist` blocks the executor's FIRST LEGAL WRITE, and every
 * escape hatch is worse — fail-open guts the guard, and a parser-free
 * re-implementation of the fence is the T-057 sin.
 *
 * So the expansion happens ONCE, at dispatch, where a built parser exists
 * by definition (`tools/e2e/scripts/lane-fence.mjs`), and this file only
 * ever READS the result. Nothing here imports anything but node builtins:
 * no `node_modules`, no build step, no `lib/parser/dist`, no `git`
 * subprocess. It runs against a checkout that was cut ninety seconds ago.
 *
 * THE LANE LIST IS READ THE SAME WAY, AND THAT WAS A COST DECISION WITH
 * A MEASUREMENT BEHIND IT. `T-154-s2`'s own design note offered two
 * routes to every live lane's fence — a `git worktree list --porcelain`
 * subprocess, or walking git's worktree administration by hand — and this
 * file walks it (`liveLanes`), and the choice was MEASURED rather than
 * assumed — `Mac.lan`, node v22.22.0, 2026-08-30, against the live
 * repository (seven worktree entries, FOUR of them lanes), 200 calls per
 * figure, two runs on a host with those four lanes and a sitting live:
 *
 *   the whole walk, every lane's manifest read   0.19 – 0.50 ms
 *   `git worktree list --porcelain` ALONE       11.06 – 23.66 ms
 *   `decide` INSIDE a lane, v1 vs this file     0.054 → 0.048 ms
 *   the runner end to end, integration seat     38.5 → 39.3 ms (MISS)
 *                                               38.4 → 41.4 ms (refusal)
 *
 * SO THE ANSWER TO THE CARD'S COST QUESTION IS: the guard is cheap
 * enough to keep on, and the design that would not have been is the one
 * this file did not take. The walk costs a fifth of a millisecond and
 * the subprocess costs FIFTY TIMES the whole walk; end to end a session
 * pays 1–3 ms on a ~39 ms hook invocation, because node's own startup
 * dominates both and always did. A LANE PAYS NOTHING — its arm never
 * reaches the walk, which is why the two figures for it are the same
 * number twice. The variance in the second run is the honest half: this
 * host had four lanes and a sitting on it, and a busy machine moves both
 * columns together.
 *
 * ── WHAT THIS FILE DELIBERATELY DOES NOT RE-SPELL ────────────────────
 * The fence VOCABULARY — slug expansion, the unfenceable directory, the
 * card's own-file carve-out, normalisation — is `lib/parser/src/fence.ts`
 * and stays there. The manifest carries the ANSWER (`paths`,
 * `alwaysWritable`), so the only path rule in this file is containment on
 * an already-normalised domain, which is the minimum a reader can do and
 * still be a reader. The two constants this file cannot avoid holding —
 * the manifest's location and the lane branch spelling — are COMPARED
 * against their authorities by `tools/e2e/tests/lane-fence.spec.ts`
 * rather than trusted, which is docs/ARCHITECTURE.md's own treatment of
 * its slug block one layer over.
 *
 * ── HOW IT ANSWERS, AND WHY ALLOW IS SILENT ──────────────────────────
 * BLOCK is exit 2 with the reason on stderr — the documented mechanism
 * that blocks by EXIT CODE and overrides any JSON, so a harness that does
 * not understand a structured verdict still refuses the write. A guard
 * whose refusal depends on a payload shape being recognised is a guard
 * that fails OPEN on the day the shape moves.
 *
 * A JUDGED ALLOW is exit 0 with NOTHING PRINTED, and that is not
 * laziness: an explicit `permissionDecision: "allow"` would SHORT-CIRCUIT
 * the harness's own permission flow and auto-approve writes the human
 * would otherwise be asked about. This hook exists to subtract
 * permission, never to grant it. So it refuses, or it stands aside.
 *
 * ── AN UNJUDGED WRITE SAYS SO (T-199) ────────────────────────────────
 * EVERY LIMIT BELOW ENDS IN AN ALLOW, and that is exactly what made this
 * file's inertness survive seven lanes: *"a fence that judges nothing and
 * a fence that approves everything are byte-identical from outside"*. So
 * a `Decision` now carries `judged`, and the four codes that DECLINE to
 * judge — `not-a-repository` (limit 2), `not-judged-detached` (limit 3),
 * `not-judged-lane-list` (limit 4) and `no-path-to-judge` (limit 5) —
 * set it FALSE. Every other verdict, allow or block, is a judgement this
 * function made and sets it TRUE.
 *
 * THE RUNNER PRINTS A DECLINE ON **stderr** AT EXIT 0, prefixed
 * `LANE FENCE (not judged)` so one grep finds refusals and declines
 * together. stderr rather than stdout for the reason above and no other:
 * stdout is the channel a harness PARSES for a permission decision, so
 * an allow that speaks there could grant. Nothing on stderr can.
 * THE LIMIT OF THAT, DECLARED: a hook's exit-0 stderr is not in the main
 * transcript, so this makes a decline AUDITABLE rather than LOUD. What it
 * removes is the byte-identity — a decline is now distinguishable from a
 * judged allow by a consumer, by a spec, and by anyone who looks.
 *
 * ── THE HONEST LIMITS, DECLARED RATHER THAN DISCOVERED ───────────────
 * 1. BASH-MEDIATED WRITES ARE NOT COVERED. A `sed -i`, a `>` redirect or
 *    a `git checkout` reaches the disk without an Edit or a Write, and
 *    v1 leaves those to the protocol. Widening the matcher to `Bash`
 *    means parsing shell to find a write target, which answers
 *    confidently and wrongly — the failure `fence.ts` refuses one layer
 *    up.
 * 2. A PATH IN NO GIT CHECKOUT AT ALL IS NOT JUDGED — and that is the
 *    WHOLE of this limit now (T-199 narrowed it). The scratchpad, `/tmp`
 *    and a working directory the human keeps outside any repository are
 *    reachable, because a manifest's domains are repository-relative and
 *    there is genuinely nothing to judge such a path against. An
 *    unrelated repository elsewhere on the machine is reached by the
 *    same reasoning one step later: it IS a checkout, so it is rooted
 *    and asked, and its own lane list — empty — allows the write.
 *    THIS LIMIT USED TO READ *"a path outside the WRITING checkout"*,
 *    which is the sentence T-199 exists to delete. It was written for an
 *    exception and met the default: with lane worktrees as siblings
 *    (lane-protocol rule 3) and the dispatching seat nested, EVERY lane
 *    write was outside the writing checkout and none was ever judged.
 *    **WHAT THE NARROWING COSTS, NAMED**: a SIBLING LANE'S TREE is no
 *    longer outside anything — a write into it is judged by THAT LANE'S
 *    fence. The hook still has no term separating an architect reaching
 *    into a lane from THE LANE'S OWN EXECUTOR writing in from a shell
 *    parked elsewhere, so both meet that lane's fence and neither meets
 *    a rule written for it. That is the honest residue, and it is
 *    strictly tighter than the alternative it replaces, which allowed
 *    both without looking. The poison drill is untouched: it runs in a
 *    DETACHED worktree and limit 3 covers it by construction.
 * 3. A DETACHED CHECKOUT IS NOT JUDGED AT ALL. Lane-ness is read off the
 *    TARGET checkout's branch, and a detached HEAD names none: the
 *    poison drill is REQUIRED to be run in a detached scratch worktree
 *    (docs/CONVENTIONS.md, POISON DRILL) and its whole job is mutating
 *    the very files a live lane holds, so judging a detached checkout
 *    would forbid the drill this project proves its guards with. The
 *    human's app checkout is detached on purpose (T-052) and rides the
 *    same rule. The seat this arm answers for is the one holding a
 *    branch that is not a lane — the integration checkout above all.
 * 4. A LANE WHOSE MANIFEST THIS SEAT CANNOT READ RESERVES NOTHING HERE.
 *    A live lane with no manifest, or a damaged one, is refused by its
 *    OWN arm at its own first write, which is where that failure has a
 *    seat to tell; treating it as reserving the repository would lock
 *    the integration seat out of the tree over a file it cannot read.
 * 5. IT IS ADVICE TO A COOPERATING HARNESS. A session that can edit
 *    `.claude/settings.json` can disarm it; the fence forbids exactly
 *    that for every lane whose `touches:` does not carry `.claude/`,
 *    which is the property this file has and not a proof.
 * 6. THE MID-INTEGRATION CRITERION CLOSES BEFORE THE LANE DOES. git
 *    drops its marker at the merge COMMIT, and a merge with no conflict
 *    never writes one at all — while lane-protocol rule 6 keeps the
 *    lane's worktree, and so its manifest, until after the CHECKPOINT.
 *    So every Edit into a JUST-MERGED lane's fence is refused
 *    `held-by-a-live-lane` for that whole window, and this repository
 *    performs verdict corrections there. Measured at T-154-s2's
 *    verification, on this card: merging it and then editing
 *    `.claude/hooks/lane-fence.mjs`, `tools/e2e/…` or
 *    `docs/CONVENTIONS.md` from the integration checkout is refused
 *    while `nputer-T-154-s2` stands. The route is to remove the
 *    worktree before the reconciling writes; the guard has a term for
 *    "on disk" and none for "merged".
 * 7. CONTAINMENT IS CASE-SENSITIVE AND THIS PROJECT'S VOLUME IS NOT.
 *    `within` compares bytes, so from a lane-less seat
 *    `DOCS/ROADMAP.md` is ALLOWED where `docs/ROADMAP.md` is refused —
 *    and on the default macOS APFS both write the same file (measured
 *    at T-154-s2's verification: writing `<repo>/DOCS/ROADMAP.md`
 *    landed in `docs/` and created no `DOCS` directory). The LANE arm
 *    has no such escape, because there an unmatched path BLOCKS; it is
 *    this arm's allow-by-default that converts a case difference into a
 *    hole. It is NOT closed by comparing case-insensitively, which
 *    would over-refuse the seat that may not be stopped on a
 *    case-sensitive volume — so it is declared rather than papered
 *    over, and the fix is a routed question.
 * 8. A REQUEST WITH NO READABLE PATH HAS NO TARGET TO ROOT FROM, so it
 *    is the one question the WRITER's cwd still answers (T-199). The
 *    asymmetry above is preserved exactly: a writer sitting in a lane is
 *    REFUSED `unreadable-request`, because inside a lane an unanswerable
 *    question fails closed; any other writer is DECLINED
 *    `no-path-to-judge`, because the seat that may not be stopped fails
 *    open. It is a real hole in this session's shape — a lane executor's
 *    cwd is the DISPATCHING checkout, so its unreadable request takes
 *    the lane-less answer — and it is a decline, so it says so.
 */

import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

/**
 * The manifest, relative to the checkout root it governs.
 *
 * `.nputer/` is the runtime directory ADR-017 already confines app-side
 * writes to, and the writer drops a self-ignoring `.gitignore` beside
 * this file so a lane can never commit its own fence into the tree
 * everyone else then reads.
 */
export const MANIFEST_REL_PATH = ".nputer/lane-fence.json";

/**
 * The manifest schema this reader understands. A manifest stamped with
 * anything else BLOCKS rather than being read optimistically: a reader
 * that guesses at an unknown shape is a reader that under-reserves.
 */
export const MANIFEST_VERSION = 1;

/**
 * The lane branch spelling, as a matcher over the FULL ref.
 *
 * THE AUTHORITY IS docs/CONVENTIONS.md's lane bullet, which publishes
 * `task/T-NNN-<slug>`, and `dispatch-brief.mjs`'s `laneSpellings` derives
 * a matcher from it for every other consumer. This file cannot call that
 * derivation — it would have to read and parse CONVENTIONS on every
 * keystroke, with no dependency budget to do it well — so it holds the
 * matcher and the spec COMPARES the two, which is the treatment
 * docs/ARCHITECTURE.md gives its own slug block. A change to the
 * published spelling reds `lane-fence.spec.ts` by name.
 *
 * THE OLDER `tNNN-…` SPELLING IS DELIBERATELY NOT MATCHED. CONVENTIONS
 * records both as live and neither as a mistake, but the old set stops at
 * T-050 and nothing dispatches into it; a lane on one is simply not
 * guarded, which is the pre-T-154 state and not a regression.
 */
export const LANE_BRANCH_RE = /^refs\/heads\/task\/T-(\d+)-.+$/;

/**
 * The paths a live lane may never veto for a seat that holds no lane.
 *
 * THESE ARE @HUMAN'S RULING WRITTEN AS CRITERIA, NOT THE HOOK'S
 * JUDGEMENT (`T-154-s2`, 2026-08-30). The ruling names three carve-outs
 * and two of them are already IN THE MANIFEST — `docs/tasks/` arrives as
 * every manifest's `alwaysWritable` (the parser's `UNFENCEABLE_PATHS`)
 * and a card's own file as its `excluded` — so this constant holds only
 * the third: the writes the integration seat makes constantly and
 * legitimately, which no lane's fence may stop. `docs/tasks/` is where
 * the dispatch and closing stamps land, so the ruling's fourth item
 * needs no entry here; a second copy of it would be a second fact.
 *
 * THE AUTHORITY IS docs/CONVENTIONS.md's own lane bullet, which
 * publishes this set in as many words, and `lane-fence.spec.ts` COMPARES
 * the two rather than trusting this one — the treatment `LANE_BRANCH_RE`
 * already gets, and for the same reason: this file cannot parse a
 * document on every keystroke, and a guard whose carve-outs drift from
 * the page that documents them is a guard nobody can predict.
 */
export const INTEGRATION_SEAT_PATHS = Object.freeze(["docs/STATE.md", "docs/checkpoints"]);

/**
 * git's own on-disk record that a checkout is mid-integration.
 *
 * ONE CARVE-OUT THE RULING DOES NOT NAME, DECLARED RATHER THAN SLIPPED
 * IN. Resolving a conflict is an Edit, and the conflicted paths of a
 * lane's merge are BY CONSTRUCTION inside that lane's fence — so a
 * lane-less arm without this criterion refuses the integrator the one
 * act that consumes lanes, and a guard that forbids merging is a guard
 * somebody turns off. It is still a criterion and not a judgement: the
 * question asked is git's, answered by a file git writes and removes
 * itself, and the merge play and the revert play (method/lane-protocol,
 * "The revert play") are the two shapes it covers. A verifier should
 * rule on whether the ruling's list wanted it; it is named on the card.
 */
export const INTEGRATION_IN_PROGRESS_MARKERS = Object.freeze([
  "MERGE_HEAD",
  "CHERRY_PICK_HEAD",
  "REVERT_HEAD",
  "rebase-merge",
  "rebase-apply",
]);

/**
 * Where a file-writing tool puts its target path.
 *
 * TWO SPELLINGS ARE ACCEPTED ON PURPOSE. The harness's own hook examples
 * read `tool_input.file_path` while its tool reference documents `path`,
 * and a guard that picked one and was wrong would answer "I cannot read
 * this request" on every write. Both are read, first present wins, and
 * the case where NEITHER is present is a refusal rather than a shrug —
 * see `decide`.
 */
export const WRITE_TOOL_PATH_FIELDS = Object.freeze([
  "file_path",
  "path",
  "notebook_path",
]);

/**
 * @typedef {object} Decision
 * @property {"allow" | "block"} verdict
 * @property {string} code   a stable, greppable name for WHY
 * @property {string} reason the sentence the blocked session reads
 * @property {boolean} judged did this function actually evaluate a
 *   fence? FALSE means it declined — see `decline` below.
 */

/**
 * The set of codes this file answers with WITHOUT judging a fence.
 *
 * EXPORTED SO A SPEC CAN ASSERT THE PARTITION rather than re-listing it
 * (T-199). A code that reaches an allow through one of the header's
 * limits belongs here; every other verdict, allow or block, is a
 * judgement. The whole point is that the two are no longer
 * indistinguishable: seven lanes ran against a fence that judged nothing
 * and produced output byte-identical to a fence that worked.
 */
export const DECLINE_CODES = Object.freeze([
  "not-a-repository",
  "not-judged-detached",
  "not-judged-lane-list",
  "no-path-to-judge",
]);

/**
 * @param {string} code
 * @param {string} reason
 * @returns {Decision}
 */
function allow(code, reason) {
  return { verdict: "allow", code, reason, judged: true };
}

/**
 * An allow this function reached WITHOUT judging any fence.
 *
 * A SEPARATE CONSTRUCTOR AND NOT A FLAG ARGUMENT, so the declining
 * branches are greppable as a set and a new one cannot be added by
 * forgetting a parameter.
 *
 * @param {string} code
 * @param {string} reason
 * @returns {Decision}
 */
function decline(code, reason) {
  return { verdict: "allow", code, reason, judged: false };
}

/**
 * @param {string} code
 * @param {string} reason
 * @returns {Decision}
 */
function block(code, reason) {
  return { verdict: "block", code, reason, judged: true };
}

/**
 * Walk up from `start` to the first directory holding a `.git` entry.
 *
 * A LANE WORKTREE'S `.git` IS A FILE, NOT A DIRECTORY, which is why this
 * tests for existence rather than for a directory: `git worktree add`
 * leaves a one-line `gitdir:` pointer, and a check for a directory would
 * walk straight past every lane this guard exists for and find the main
 * checkout instead.
 *
 * @param {string} start
 * @returns {string | undefined} the checkout root, or `undefined` when
 *   there is no repository above `start` at all
 */
export function findCheckoutRoot(start) {
  let dir = path.resolve(start);
  for (;;) {
    try {
      statSync(path.join(dir, ".git"));
      return dir;
    } catch {
      /* keep climbing */
    }
    const parent = path.dirname(dir);
    if (parent === dir) return undefined;
    dir = parent;
  }
}

/**
 * This checkout's own git directory, resolved through both shapes.
 *
 * A LANE WORKTREE'S `.git` IS A FILE holding a `gitdir:` pointer, and an
 * ordinary checkout's is a directory. One function answers for both, and
 * it is ONE function because three callers below need it — the HEAD read,
 * the lane list and the mid-integration check — and three copies of a
 * pointer-following rule are three chances to follow it differently.
 *
 * @param {string} root
 * @returns {string | undefined} the git directory, or `undefined` when
 *   `root` carries no `.git` this reader can follow
 */
export function gitDirOf(root) {
  const gitPath = path.join(root, ".git");
  let stat;
  try {
    stat = statSync(gitPath);
  } catch {
    return undefined;
  }
  if (stat.isDirectory()) return gitPath;
  let pointer;
  try {
    pointer = readFileSync(gitPath, "utf8");
  } catch {
    return undefined;
  }
  const m = /^gitdir:\s*(.+?)\s*$/m.exec(pointer);
  if (m === null) return undefined;
  const target = /** @type {string} */ (m[1]);
  return path.isAbsolute(target) ? target : path.resolve(root, target);
}

/**
 * The COMMON git directory — the one every worktree of a repository
 * shares, and the only place the whole lane list exists.
 *
 * A linked worktree's git directory is `<common>/worktrees/<name>` and
 * carries a `commondir` file pointing back (`../..` in practice, and
 * resolved relative to the directory holding it, which is git's own
 * rule). An ordinary checkout has no such file and IS the common
 * directory. Nothing here is a guess about layout: both files are git's
 * documented worktree administration and both are one line long.
 *
 * @param {string} gitDir
 * @returns {string}
 */
export function gitCommonDirOf(gitDir) {
  let raw;
  try {
    raw = readFileSync(path.join(gitDir, "commondir"), "utf8").trim();
  } catch {
    return gitDir;
  }
  if (raw === "") return gitDir;
  return path.isAbsolute(raw) ? raw : path.resolve(gitDir, raw);
}

/**
 * The full symbolic ref a git directory's HEAD names, read off disk.
 *
 * NO `git` SUBPROCESS, for the reason at the top of this file: the hook
 * runs on every write and a spawn per keystroke is a tax the guard has to
 * justify. `HEAD` is one small file, in a checkout's own git directory
 * and in every linked worktree's administration alike — which is why the
 * lane list can read a SIBLING'S branch without entering its tree.
 *
 * Returns `undefined` for a DETACHED head (the content is a bare object
 * id, not a `ref:` line) and for anything unreadable. Both mean the same
 * thing to the caller: this checkout names no branch, so it is not a lane.
 *
 * @param {string} gitDir
 * @returns {string | undefined}
 */
export function headRefIn(gitDir) {
  let head;
  try {
    head = readFileSync(path.join(gitDir, "HEAD"), "utf8");
  } catch {
    return undefined;
  }
  const ref = /^ref:\s*(\S+)\s*$/m.exec(head);
  return ref === null ? undefined : /** @type {string} */ (ref[1]);
}

/**
 * The full symbolic ref this CHECKOUT's HEAD names.
 *
 * @param {string} root
 * @returns {string | undefined}
 */
export function readHeadRef(root) {
  const gitDir = gitDirOf(root);
  return gitDir === undefined ? undefined : headRefIn(gitDir);
}

/**
 * One frontmatter line, verbatim, from a card's own frontmatter block.
 *
 * SCOPED TO THE FRONTMATTER ON PURPOSE: a card's BODY routinely quotes a
 * `touches:` line (T-212's does), and a body match would make the stamp
 * compare against prose.
 *
 * THIS IS THE ONE FRONTMATTER-LINE READER IN THE HOOK BUDGET, and it is
 * generic in the FIELD rather than copied per field. `touchesLineOf`
 * below is this function with `touches` bound, and `landing-gate.mjs`
 * spends it for `id` — a second scanner for the second field would be two
 * chances to disagree about where the frontmatter ends, and the two
 * callers would disagree only on the malformed cards nobody tests.
 *
 * @param {string} text the card file's whole content
 * @param {string} field the frontmatter key, without its colon
 * @returns {string | undefined} the line, trimmed of trailing whitespace
 */
export function frontmatterLineOf(text, field) {
  const lines = text.split(/\r?\n/);
  if (lines[0] !== "---") return undefined;
  for (let i = 1; i < lines.length; i += 1) {
    const line = /** @type {string} */ (lines[i]);
    if (line === "---") return undefined;
    if (line.startsWith(`${field}:`)) return line.replace(/\s+$/, "");
  }
  return undefined;
}

/**
 * The card's `touches:` line, verbatim, from a card's frontmatter.
 *
 * ONE EXTRACTION, THREE CALLERS, AND THE SPEC PROVES THEY AGREE. The
 * writer stamps what IT read; the write-time arm reads the card again and
 * compares the two strings; `landing-gate.mjs` reads it a third time off
 * the card AS COMMITTED ON MAIN. A second implementation of "which line
 * is the touches line" would be chances to disagree, so
 * `lane-fence.spec.ts` runs the callers over EVERY live card and requires
 * character-identical answers.
 *
 * @param {string} text the card file's whole content
 * @returns {string | undefined} the line, trimmed of trailing whitespace
 */
export function touchesLineOf(text) {
  return frontmatterLineOf(text, "touches");
}

/**
 * Is `rel` inside the path domain `domain`?
 *
 * Containment IS the rule, and equality is its degenerate case: a fence
 * naming `tools/e2e` reserves `tools/e2e/tests/x.spec.ts`. Both sides
 * arrive already normalised — the domains from `expandFence`, `rel` from
 * `path.relative` — so this function normalises nothing and is not a
 * second copy of `normalizeFenceToken`.
 *
 * @param {string} rel
 * @param {string} domain
 * @returns {boolean}
 */
export function within(rel, domain) {
  return rel === domain || rel.startsWith(`${domain}/`);
}

/**
 * @typedef {object} Manifest
 * @property {number} version
 * @property {string} taskId
 * @property {string} branch
 * @property {string} card
 * @property {string} touchesLine
 * @property {string[]} paths
 * @property {string[]} excluded
 * @property {string[]} alwaysWritable
 */

/**
 * Read and shape-check the manifest.
 *
 * EVERY FAILURE IS A REFUSAL AND NONE IS A SHRUG. A manifest that is
 * absent, unparseable, of an unknown version or missing a field is a
 * manifest this reader cannot enforce, and a guard that cannot enforce
 * says so — `fence.ts`'s own three-verdict rule, one layer down.
 *
 * @param {string} root
 * @returns {{ manifest: Manifest } | { problem: string }}
 */
export function readManifest(root) {
  const file = path.join(root, MANIFEST_REL_PATH);
  let raw;
  try {
    raw = readFileSync(file, "utf8");
  } catch {
    return { problem: `no fence manifest at ${MANIFEST_REL_PATH}` };
  }
  /** @type {unknown} */
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    return {
      problem:
        `the fence manifest at ${MANIFEST_REL_PATH} is not readable JSON ` +
        `(${err instanceof Error ? err.message : String(err)})`,
    };
  }
  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
    return { problem: `the fence manifest at ${MANIFEST_REL_PATH} is not an object` };
  }
  const obj = /** @type {Record<string, unknown>} */ (parsed);
  if (obj["version"] !== MANIFEST_VERSION) {
    return {
      problem:
        `the fence manifest at ${MANIFEST_REL_PATH} is version ` +
        `${JSON.stringify(obj["version"])}, and this hook reads version ${MANIFEST_VERSION}`,
    };
  }
  /** @param {unknown} v @returns {v is string[]} */
  const isStrings = (v) => Array.isArray(v) && v.every((x) => typeof x === "string");
  const { taskId, branch, card, touchesLine, paths, excluded, alwaysWritable } = obj;
  if (
    typeof taskId !== "string" ||
    typeof branch !== "string" ||
    typeof card !== "string" ||
    typeof touchesLine !== "string" ||
    !isStrings(paths) ||
    !isStrings(excluded) ||
    !isStrings(alwaysWritable)
  ) {
    return {
      problem:
        `the fence manifest at ${MANIFEST_REL_PATH} is missing a field this hook needs ` +
        "(taskId, branch, card, touchesLine, paths, excluded, alwaysWritable)",
    };
  }
  return {
    manifest: {
      version: MANIFEST_VERSION,
      taskId,
      branch,
      card,
      touchesLine,
      paths,
      excluded,
      alwaysWritable,
    },
  };
}

/**
 * EVERY LIVE LANE of the repository `root` belongs to, with the fence
 * each one holds — the question v1 could not ask.
 *
 * READ OFF GIT'S OWN WORKTREE ADMINISTRATION, NOT OFF A SUBPROCESS, for
 * the cost measured in this file's header. Every linked worktree has a
 * directory under `<common>/worktrees/`, carrying that worktree's own
 * `HEAD` and a `gitdir` file naming its `.git`; the MAIN worktree's HEAD
 * is the common directory's own. That is the same pair
 * `git worktree list --porcelain` prints, and the branch is what decides
 * lane-ness here exactly as it does for the writing checkout — a
 * DETACHED entry is not a lane (docs/CONVENTIONS.md's lane bullet, which
 * measured six entries and one lane).
 *
 * A LANE IS SKIPPED WHEN ITS MANIFEST CANNOT BE READ, and that is limit 4
 * rather than an oversight: a removed lane leaves its administration
 * behind until somebody prunes it, and a lane dispatched without its
 * fence step has no manifest at all — treating either as reserving
 * anything would let a directory nobody is working in lock the
 * integration seat out of the repository. The refusal for THAT lane
 * belongs to that lane's own arm, at its own first write.
 *
 * NO SELF-SKIP, and it is not missing: `decide` reaches this only from a
 * checkout that is NOT on a lane branch, so the caller can never be in
 * the list it gets back. Called from a lane — as a spec may — it lists
 * that lane too, because "every live lane" is what it says.
 *
 * @param {string} root
 * @returns {{ branch: string, worktree: string, manifest: Manifest }[]}
 */
export function liveLanes(root) {
  const gitDir = gitDirOf(root);
  if (gitDir === undefined) return [];
  const common = gitCommonDirOf(gitDir);

  /** @type {{ adminDir: string, worktree: string }[]} */
  const candidates = [];
  // The main worktree: git keeps its administration AT the common
  // directory, so the checkout holding it is the directory above.
  if (path.basename(common) === ".git") {
    candidates.push({ adminDir: common, worktree: path.dirname(common) });
  }
  /** @type {import("node:fs").Dirent[]} */
  let entries = [];
  try {
    entries = readdirSync(path.join(common, "worktrees"), { withFileTypes: true });
  } catch {
    /* a repository with no linked worktree has no such directory */
  }
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const adminDir = path.join(common, "worktrees", entry.name);
    let pointer;
    try {
      pointer = readFileSync(path.join(adminDir, "gitdir"), "utf8").trim();
    } catch {
      continue;
    }
    if (pointer === "") continue;
    // `gitdir` names the worktree's own `.git`, so the tree is its parent.
    candidates.push({ adminDir, worktree: path.dirname(pointer) });
  }

  /** @type {{ branch: string, worktree: string, manifest: Manifest }[]} */
  const lanes = [];
  for (const candidate of candidates) {
    const branch = headRefIn(candidate.adminDir);
    if (branch === undefined || !LANE_BRANCH_RE.test(branch)) continue;
    const read = readManifest(candidate.worktree);
    if ("problem" in read) continue;
    lanes.push({ branch, worktree: candidate.worktree, manifest: read.manifest });
  }
  return lanes;
}

/**
 * Is this checkout in the middle of an integration git itself records?
 *
 * @param {string} root
 * @returns {string | undefined} the marker git left, or `undefined`
 */
export function integrationInProgress(root) {
  const gitDir = gitDirOf(root);
  if (gitDir === undefined) return undefined;
  for (const marker of INTEGRATION_IN_PROGRESS_MARKERS) {
    try {
      statSync(path.join(gitDir, marker));
      return marker;
    } catch {
      /* not this one */
    }
  }
  return undefined;
}

/**
 * Why a path a lane reserves is nonetheless the lane-less seat's to
 * write — or `undefined`, which is the refusal.
 *
 * THE ORDER IS THE RULING'S AND THE FIRST TWO COME OUT OF THE MANIFEST,
 * so the two carve-outs the method already computes are READ rather than
 * re-spelled here: `alwaysWritable` is the parser's `UNFENCEABLE_PATHS`
 * and `excluded` is the card's own file, both stamped at dispatch by the
 * one implementation. Only the third is this file's constant, and even
 * that one is compared against the document that publishes it.
 *
 * NOT USED BY THE LANE ARM, and that is deliberate rather than an
 * oversight: these are the carve-outs of a seat holding NO fence, and a
 * lane writing `docs/STATE.md` is still outside its own fence and still
 * refused — the behaviour v1 pins.
 *
 * THE OWN-FILE TEST COMES FIRST THOUGH `docs/tasks` WOULD CATCH IT
 * ANYWAY, for two reasons that agree. Every card lives under the
 * unfenceable directory, so ordered the other way this branch would
 * answer for nothing that reaches it — an arm no write can select is an
 * arm no mutation can kill, and the ruling names it as a criterion in
 * its own right. This way each branch owns a distinct write: the card of
 * the lane that holds the domain, any OTHER path under `docs/tasks`, and
 * this seat's standing writes.
 *
 * @param {string} rel a path relative to the writing checkout's root
 * @param {Manifest} manifest
 * @returns {{ domain: string, why: string } | undefined}
 */
export function carveOutFor(rel, manifest) {
  for (const domain of manifest.excluded) {
    if (within(rel, domain)) {
      return {
        domain,
        why: `it is ${manifest.taskId}'s own card file, which is outside every fence including its own`,
      };
    }
  }
  for (const domain of manifest.alwaysWritable) {
    if (within(rel, domain)) {
      return { domain, why: "no card may fence it and every card's protocol writes there" };
    }
  }
  for (const domain of INTEGRATION_SEAT_PATHS) {
    if (within(rel, domain)) {
      return { domain, why: "it is a standing write of the seat that holds no lane" };
    }
  }
  return undefined;
}

/**
 * The route a blocked LANE-LESS seat takes, quoted in every refusal of
 * the second kind.
 *
 * A DIFFERENT ROUTE FROM `ROUTE`, BECAUSE IT IS A DIFFERENT ERROR. A
 * lane outside its fence has found a dispatch error; a seat with no lane
 * inside somebody else's fence has found a live lane, which is an
 * ordinary, correct state of the board and needs no triage at all — it
 * needs the write to go where the work is.
 */
export const ROUTE_LANE_LESS =
  "A live lane's fence is not overridden by the seat that dispatched it " +
  "(method/lane-protocol.md rule 5, and @human's ruling of 2026-08-30 on T-154-s2). Either the " +
  "write belongs to that lane — hand it to the session holding it, or file it as a " +
  "`status: suggested` card under docs/tasks/ with `suggested_by:` set — or it waits for the " +
  "merge, after which the worktree is removed and the fence is gone with it. Editing here while " +
  "the lane is live is the incident this guard exists for: the lane's own diff and this write " +
  "are two answers to one file, and the merge is where they collide.";

/** The route a blocked session takes, quoted in every fence refusal. */
export const ROUTE =
  "A fence is not widened from inside the lane it fences " +
  "(method/lane-protocol.md rule 5). Either the work belongs to another card — " +
  "file it as a `status: suggested` card under docs/tasks/ with `suggested_by:` set and " +
  "build the part that fits — or the fence itself is wrong, which is a dispatch error for " +
  "triage to rule on and never this hook's to decide.";

/**
 * @typedef {object} Request
 * @property {string} [toolName]
 * @property {Record<string, unknown>} [toolInput]
 * @property {string} [cwd]
 */

/**
 * The path a file-writing tool was called with, first spelling present.
 *
 * ONE EXTRACTION FOR BOTH SEATS. It was inline in the lane arm while
 * there was one seat; a second copy in the lane-less arm would be two
 * chances to disagree about which field the harness sends — and the two
 * seats answer a request with NO readable path in OPPOSITE directions,
 * so the disagreement would be invisible in every test that only drives
 * one of them.
 *
 * @param {Record<string, unknown> | undefined} toolInput
 * @returns {string | undefined}
 */
export function targetOf(toolInput) {
  for (const field of WRITE_TOOL_PATH_FIELDS) {
    const v = toolInput?.[field];
    if (typeof v === "string" && v !== "") return v;
  }
  return undefined;
}

/**
 * The lane-less seat's verdict: does any LIVE lane hold this path?
 *
 * EVERY REFUSAL HERE RESTS ON SOMETHING READ, AND EVERY UNCERTAINTY IS
 * AN ALLOW — the inverse of the lane arm, for the reason in this file's
 * header. A detached checkout is not judged at all (limit 3), a lane
 * whose manifest cannot be read reserves nothing (limit 4), and a
 * checkout git itself records as mid-merge is free
 * (`INTEGRATION_IN_PROGRESS_MARKERS`).
 *
 * `root` IS THE TARGET'S CHECKOUT AND NOT THE WRITER'S (T-199), so this
 * arm answers for the repository the write LANDS in. A path in no
 * checkout at all never reaches here — `decide` declines it before
 * choosing an arm, which is all that survives of limit 2.
 *
 * @param {Request} request
 * @param {string} root      the TARGET's checkout root, not the writer's
 * @param {string | undefined} headRef
 * @param {string} abs       the target, already resolved and absolute
 * @returns {Decision}
 */
function laneLessVerdict(request, root, headRef, abs) {
  if (headRef === undefined) {
    return decline(
      "not-judged-detached",
      `${root} names no branch, so it is a detached checkout — a drill, a scratch tree or the ` +
        "human's app — and limit 3 leaves it unjudged",
    );
  }
  const seat = `${root} is on ${headRef}, which is not a ${"task/T-NNN-<slug>"} lane branch`;
  const rel = path.relative(root, abs).split(path.sep).join("/");

  /** @type {{ lane: { branch: string, worktree: string, manifest: Manifest }, domain: string, carve: { domain: string, why: string } } | undefined} */
  let carved;
  /** @type {{ branch: string, worktree: string, manifest: Manifest }[]} */
  let lanes;
  try {
    lanes = liveLanes(root);
  } catch {
    // The lane list is a read of a live environment and this seat is the
    // one that may not be stopped: an administration directory this hook
    // cannot walk is an allow, never a repository-wide refusal.
    return decline("not-judged-lane-list", `${seat}, and its lane list could not be read`);
  }
  for (const lane of lanes) {
    const domain = lane.manifest.paths.find((d) => within(rel, d));
    if (domain === undefined) continue;
    const carve = carveOutFor(rel, lane.manifest);
    if (carve !== undefined) {
      carved = { lane, domain, carve };
      continue;
    }
    const merging = integrationInProgress(root);
    if (merging !== undefined) {
      return allow(
        "mid-integration",
        `${rel} is inside ${lane.manifest.taskId}'s fence (${domain}), and this checkout is ` +
          `mid-integration — git's own ${merging} is on disk. Resolving a lane's merge is an ` +
          "Edit into that lane's own fence by construction, so the act that CONSUMES a fence is " +
          "not refused by it.",
      );
    }
    return block(
      "held-by-a-live-lane",
      `LANE FENCE: ${rel} is inside ${lane.manifest.taskId}'s fence, and this seat holds no lane.\n` +
        `  ${seat}\n` +
        `  the lane: ${lane.manifest.taskId} on ${lane.branch}\n` +
        `  its worktree: ${lane.worktree}\n` +
        `  its fence (${lane.manifest.touchesLine}) expands to:\n` +
        lane.manifest.paths.map((p) => `    ${p}\n`).join("") +
        `  the domain that holds this path: ${domain}\n` +
        `  the path refused: ${rel}\n` +
        `  carve-outs checked and none matched: ${lane.manifest.alwaysWritable.join(", ")} ` +
        `(unfenceable), ${lane.manifest.excluded.length > 0 ? lane.manifest.excluded.join(", ") : "the card's own file"} ` +
        `(outside every fence), ${INTEGRATION_SEAT_PATHS.join(", ")} (this seat's standing writes)\n` +
        `  ${ROUTE_LANE_LESS}`,
    );
  }
  if (carved !== undefined) {
    return allow(
      "protocol-carve-out",
      `${rel} is inside ${carved.lane.manifest.taskId}'s fence (${carved.domain}) and is written ` +
        `anyway: ${carved.carve.domain} is carved out because ${carved.carve.why} (T-154-s2, ` +
        "@human's ruling of 2026-08-30)",
    );
  }
  return allow("not-a-lane", `${seat}, and no live lane's manifest reserves ${rel}`);
}

/**
 * The verdict when the request carries NO path this hook can read.
 *
 * THE ONE QUESTION THE TARGET CANNOT ANSWER, so it is the one question
 * the WRITER's cwd still answers (limit 8). Both directions are exactly
 * v2's: a writer sitting in a lane is refused, because inside a lane an
 * unanswerable question fails closed; every other writer is DECLINED,
 * because the seat that may not be stopped fails open.
 *
 * IT IS A DECLINE AND NOT A JUDGED ALLOW, which is the half T-199 adds:
 * a lane executor's cwd is the DISPATCHING checkout in this project's
 * dispatch shape, so its unreadable request takes the lane-less answer
 * and slips a fence that would otherwise hold. That is a real hole, it
 * cannot be closed from a request with no path in it, and a hole that
 * announces itself is the whole difference between this file and the one
 * that judged nothing for seven lanes.
 *
 * @param {Request} request
 * @param {string} cwd
 * @returns {Decision}
 */
function noTargetVerdict(request, cwd) {
  const root = findCheckoutRoot(cwd);
  const headRef = root === undefined ? undefined : readHeadRef(root);
  if (headRef !== undefined && LANE_BRANCH_RE.test(headRef)) {
    return block(
      "unreadable-request",
      `LANE FENCE: ${request.toolName ?? "this tool"} was called with no path this hook can read ` +
        `(it looks for ${WRITE_TOOL_PATH_FIELDS.join(", ")}), and it was called from ${root}, ` +
        `which is on the lane branch ${headRef}. Inside a lane an unreadable request is a ` +
        "refusal and never a shrug: a fence that answers `no overlap` when it means `I do not " +
        "know` is worse than one that refuses (lib/parser/src/fence.ts).",
    );
  }
  return decline(
    "no-path-to-judge",
    `${request.toolName ?? "this tool"} was called with no path this hook can read (it looks for ` +
      `${WRITE_TOOL_PATH_FIELDS.join(", ")}), and ${cwd} holds no lane — so there is neither a ` +
      "target to root a fence from nor a lane to refuse on behalf of. Outside a lane that is an " +
      "allow and inside one it is a refusal: the seat that may be stopped fails closed, and the " +
      "seat that may not fails open (limit 8 in this file's header).",
  );
}

/**
 * The whole decision.
 *
 * READ THE ORDER, IT IS THE MECHANISM. The TARGET is resolved first, its
 * repository second, and lane-ness third — from THAT repository's
 * BRANCH alone, so which of the two rules applies is decided before any
 * manifest is opened: the target checkout's own below, every live lane's
 * in `laneLessVerdict`. An allow is then a decision this function made
 * rather than a mechanism that failed to arm, which is the claim T-199
 * found to be false of the previous order.
 *
 * THE ORDER MOVED AND THAT IS THE FIX. v2 settled the repository from
 * the WRITER's cwd, which reads as harmless until you notice that a
 * lane worktree is required to be a SIBLING of the repository and that
 * the dispatching seat is nested inside it: every lane write then landed
 * in a tree the writer's root did not contain, and the out-of-checkout
 * allow — written for the scratchpad — swallowed the whole guard. The
 * repository a write belongs to is a property of WHERE IT LANDS, and
 * nothing about where the writer is parked.
 *
 * IT IS ALSO WHY A STRAY MANIFEST CANNOT LOCK ANYONE OUT, WHICH SURVIVED
 * THE WIDENING. A manifest is read for a checkout only when THAT
 * checkout's own HEAD is on a lane branch — its own below, a sibling's
 * from that sibling's administration — so a manifest sitting in a
 * non-lane tree is still consulted by nobody and the worst a misplaced
 * file can do is nothing. The guard is still tight in the lane, because
 * a lane cannot escape by deleting its own manifest (that is the second
 * arm) and cannot rewrite it either (the manifest is outside every
 * fence, so writing to it is the fourth arm).
 *
 * @param {Request} request
 * @returns {Decision}
 */
export function decide(request) {
  const cwd = typeof request.cwd === "string" && request.cwd !== "" ? request.cwd : process.cwd();

  const target = targetOf(request.toolInput);
  if (target === undefined) return noTargetVerdict(request, cwd);

  // THE ONE REMAINING JOB OF `cwd`: a relative target is relative to the
  // writer, and nothing else in this function is.
  const abs = path.resolve(cwd, target);
  // FROM THE TARGET'S OWN DIRECTORY, because the target is a FILE and
  // the file need not exist yet. The innermost `.git` wins, which is the
  // right answer for a checkout nested inside another one — the
  // dispatching seat under `.claude/worktrees/` is exactly that shape.
  const root = findCheckoutRoot(path.dirname(abs));
  if (root === undefined) {
    return decline(
      "not-a-repository",
      `${abs} sits in no git checkout, so no lane's fence is repository-relative to it (limit 2 ` +
        "in this file's header)",
    );
  }
  const headRef = readHeadRef(root);
  if (headRef === undefined || !LANE_BRANCH_RE.test(headRef)) {
    return laneLessVerdict(request, root, headRef, abs);
  }
  const branch = headRef.replace(/^refs\/heads\//, "");

  const read = readManifest(root);
  if ("problem" in read) {
    return block(
      "no-manifest",
      `LANE FENCE: ${read.problem}. This checkout is on the lane branch ${branch}, so every write ` +
        "here is fenced — and the fence is expanded ONCE, at dispatch, by " +
        "`node tools/e2e/scripts/brief.mjs --task <T-NNN> --write-fence <worktree>` run from the " +
        "integration checkout. A lane branch with no readable manifest means that step was " +
        "skipped or its output was damaged; ask the dispatcher to re-run it rather than editing " +
        "the manifest by hand.",
    );
  }
  const manifest = read.manifest;

  let cardText;
  try {
    cardText = readFileSync(path.join(root, manifest.card), "utf8");
  } catch {
    return block(
      "stale-stamp",
      `LANE FENCE: the manifest was expanded from ${manifest.card}, which this checkout cannot ` +
        "read. Re-expand the fence (`brief.mjs --task " +
        `${manifest.taskId} --write-fence <worktree>\`) — this hook compares the card's own ` +
        "`touches:` line against the manifest's stamp and will not guess which side moved.",
    );
  }
  const live = touchesLineOf(cardText);
  if (live !== manifest.touchesLine) {
    return block(
      "stale-stamp",
      `LANE FENCE: ${manifest.card}'s touches line is now ${JSON.stringify(live ?? null)} and the ` +
        `manifest was stamped from ${JSON.stringify(manifest.touchesLine)}. Re-expand the fence ` +
        `(\`brief.mjs --task ${manifest.taskId} --write-fence <worktree>\`) from a checkout with a ` +
        "built parser. A fence is not widened from inside the lane it fences, so editing the " +
        "card's own `touches:` here does not move the fence — it stops the hook being able to " +
        "read one.",
    );
  }

  // NO OUT-OF-CHECKOUT BRANCH HERE ANY MORE, AND ITS ABSENCE IS THE
  // FIX (T-199). `root` is derived FROM `abs`, so `rel` cannot escape it
  // and the old `rel.startsWith("../")` allow was not merely unused — it
  // was the arm every lane write took. An allow no mutation can kill is
  // an allow no test can prove, so it is gone rather than left inert.
  const rel = path.relative(root, abs).split(path.sep).join("/");

  for (const domain of manifest.alwaysWritable) {
    if (within(rel, domain)) {
      return allow(
        "always-writable",
        `${rel} is under ${domain}, which no card may fence and every card writes to`,
      );
    }
  }
  for (const domain of manifest.paths) {
    if (within(rel, domain)) {
      return allow("inside-the-fence", `${rel} is inside the fence domain ${domain}`);
    }
  }

  return block(
    "outside-the-fence",
    `LANE FENCE: ${rel} is outside ${manifest.taskId}'s fence.\n` +
      `  the fence (${manifest.touchesLine}) expands to:\n` +
      manifest.paths.map((p) => `    ${p}\n`).join("") +
      `  always writable: ${manifest.alwaysWritable.join(", ")}\n` +
      `  the path refused: ${rel}\n` +
      `  ${ROUTE}`,
  );
}
