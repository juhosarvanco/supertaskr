/**
 * THE PUSH IS JUDGED BY GIT ITSELF (T-314) — the decision half.
 *
 * `.claude/hooks/pre-push` is a `pre-push` hook; git runs it inside the
 * checkout being pushed and hands it, on standard input, one line per
 * proposed update:
 *
 *     <local ref> SP <local object> SP <remote ref> SP <remote object> LF
 *
 * This module turns those lines into a verdict. `pre-push-hook.mjs` runs
 * it and answers with an exit code; the split is `push-guard.mjs`'s and
 * exists for its reason — execution in the runner, decision in the module
 * beside it, so importing the decision is side-effect-free.
 *
 * ── WHAT THIS REPLACES, AND WHY A SECOND PLACE TO DECIDE EXISTS ──────
 * `push-guard.mjs` is registered as a Claude `PreToolUse` hook on the
 * `Bash` tool. That gives it two properties this file does not inherit
 * and one it must not lose:
 *
 *   IT IS A HARNESS'S HOOK, so under any other harness NOTHING RUNS. A
 *     push typed in a session that is not Claude's reaches the remote
 *     ungraded, and no arm anywhere records that it was never asked.
 *   IT JUDGES A COMMAND STRING. `pushCwds` spends four screens deriving
 *     which checkout a push acts on from the TEXT a session typed, and
 *     its own header records the residual: a push spelled with a leading
 *     `cd` once passed unjudged, and the direction of that doubt is an
 *     allow. Git hands this file the checkout by running the hook in it.
 *   IT JUDGES HEAD. `headTree(root)` is the key for the token arm, and
 *     HEAD is not what a push carries: `git push origin <sha>:main`,
 *     `git push origin HEAD~1:main` and a push made from a checkout whose
 *     HEAD moved after the battery ran all carry a tree that is not
 *     HEAD's. Git hands this file the candidate object per update.
 *
 * THE THIRD IS THIS CARD'S OWN SUBJECT and the first two are why it is
 * worth having twice: the `PreToolUse` guard stays exactly as it is, as a
 * SECOND NET (this card's fourth criterion), and nothing here changes it.
 *
 * ── THE EVIDENCE IS READ FROM THE CANDIDATE, NEVER FROM HEAD ─────────
 * Every update is judged on its own two objects: the range is
 * `<remote old object>..<local new object>`, and the token is required to
 * match the tree of the LOCAL NEW OBJECT. That is an ADDITIONAL binding
 * and never a substitute (this card's second criterion): the range-derived
 * owed set and `judgeToken`'s unchanged-tree checks — `dirty` and
 * `treeAtWrite` — are asked exactly as `push-guard.mjs` asks them, and the
 * tree comparison is keyed to the candidate instead of to HEAD. A token
 * minted for a different tree is refused as `token-stale` by the same
 * function that refuses it at the other hook; a token minted for the
 * pushed tree whose measured set does not cover the pushed range is still
 * refused as `token-partial`.
 *
 * ── ONE UNQUALIFIED UPDATE REFUSES THE WHOLE PUSH, AND THAT IS GIT'S ─
 * A `pre-push` hook has ONE exit code for the whole invocation. So every
 * update is judged, every refusal is named, and the refusal says out loud
 * that the qualified updates in the same push do not land either — which
 * is a property of the mechanism rather than a choice made here, and a
 * seat that is not told it will read a refusal about `refs/heads/x` and
 * believe `refs/heads/y` went.
 *
 * ── AN UNSUPPORTED SHAPE IS REFUSED BY NAME, NOT WAVED THROUGH ───────
 * A deletion carries no candidate, so there is no tree to key a token to
 * and no range to derive; a ref outside `refs/heads/` is not a thing this
 * project's owed-set derivation has ever been asked about. Both are
 * refused and named. THAT IS THE OPPOSITE DIRECTION FROM THE INABILITIES
 * BELOW and the difference is whose inability it is: a shape this guard
 * cannot judge is a push asking for something the guard was never given
 * a rule for, and allowing it would make the rule optional by spelling.
 * An inability of the guard's own — no upstream object, no runner in this
 * checkout, an answer it cannot parse — falls back to the WHOLE battery,
 * which is `push-guard.mjs`'s discipline and is stricter, not weaker.
 *
 * ── THE ARMS IT DOES NOT ASK, DECLARED RATHER THAN DISCOVERED ────────
 * THE CI ARM. `ciVerdict` makes a network round trip with a 15-second
 * hang bound, and it is the one arm whose subject is a machine that is
 * not this one. A `pre-push` hook runs on EVERY push, including ones no
 * session typed, and a guard that adds a network call to `git push` is a
 * guard somebody runs with `--no-verify`. The `PreToolUse` guard asks it
 * before the command runs, which is where a seat can act on the answer.
 * THE COST OF THAT OMISSION IS STATED: a push made outside a Claude
 * session is not told about a red or running CI job by this file.
 *
 * ── AND A DELIBERATE BYPASS IS NOT CLOSED HERE ──────────────────────
 * `git push --no-verify` skips every `pre-push` hook, and a push from a
 * checkout where the hook was never installed runs nothing. Neither is
 * closeable from inside a hook — a client-side hook is advice the client
 * can decline — and v1 closes both BY PROCEDURE, which the owner accepted
 * on 2026-09-12 and docs/CONVENTIONS.md records at the push bullet. The
 * public check is unchanged and is not a hook at all: the runner's own
 * owed set over the pushed range, re-run on a machine that is not this
 * one. A protected receiving gate and credential isolation are separate
 * proposals (T-310).
 *
 * ── NOTHING BUT NODE BUILTINS AND THE HOOKS BESIDE IT ────────────────
 * `push-guard.mjs`'s rule, for its reason: a lane worktree ninety seconds
 * old has no `node_modules` anywhere in it, and this file is loaded by
 * git in exactly such a tree. Every import below is a builtin or a hook
 * in this directory — and `push-guard.mjs`'s own one-import exception
 * rides along transitively, arguing itself at its own import line.
 */

import { spawnSync } from "node:child_process";
import { statSync } from "node:fs";
import path from "node:path";
import { LANE_BRANCH_RE, findCheckoutRoot, readHeadRef, readManifest } from "./lane-fence.mjs";
import { TOKEN_REL_PATH, judgeToken, readToken } from "./gate-token.mjs";
import {
  INTEGRATION_BRANCH,
  laneLandingVerdict,
  mergeLandingVerdict,
} from "./landing-gate.mjs";
import {
  ANNOUNCED_ALLOW_CODES,
  CHEAP_CHECKS_EXIT,
  CHECK_ARGV,
  CHECK_DIR_REL_PATH,
  CHECK_EXIT,
  GRAPH_REL_PATH,
  INDEX_CRATE_MANIFEST_REL_PATH,
  laneCanRegenerate,
  runCheapChecks,
  runCheck,
  runOwedSet,
} from "./push-guard.mjs";
import { HOLDER_REL_PATH, holderVerdict } from "../../tools/e2e/scripts/checkout-currency.mjs";

/**
 * The hook file git runs, named once.
 *
 * BOTH HALVES OF THIS PROJECT READ IT — the installer writes
 * `core.hooksPath` pointing at this file's own directory, and the seat
 * verbs report a checkout that does not carry it as unguarded — so the
 * name lives beside the code it names rather than in either caller.
 */
export const HOOK_FILE_NAME = "pre-push";

/** @see HOOK_FILE_NAME */
export const HOOK_DIR_REL_PATH = ".claude/hooks";

/**
 * An object id of all zeros is git's way of saying THERE IS NO OBJECT.
 *
 * WRITTEN FOR BOTH HASH LENGTHS, deliberately. This repository is sha1
 * today and the constant that decides whether a push is a DELETION must
 * not be the thing that breaks on a repository that is not. The class is
 * "all zeros", which is the property git documents, and not "forty".
 */
export const ZERO_OID_RE = /^0+$/;

/** An object id, in either of git's two hash lengths. */
export const OID_RE = /^[0-9a-f]{40}$|^[0-9a-f]{64}$/;

/**
 * WHOSE TREE THIS GUARD COMPARES A TOKEN AGAINST, in the one word
 * `judgeToken`'s sentences need.
 *
 * `push-guard.mjs` keys that judgement to HEAD and its refusals say so.
 * This hook keys it to the object the push would SEND, which is a
 * different commit whenever a push does not carry HEAD — so the noun is
 * handed over rather than left to be wrong.
 */
export const TREE_OWNER = "the pushed commit";

/** The only remote ref shape this guard has a rule for. */
export const BRANCH_REF_PREFIX = "refs/heads/";

/**
 * The fields on one line of a `pre-push` hook's standard input.
 *
 * NAMED RATHER THAN COUNTED AT THE SPLIT SITE, so the refusal for a line
 * that does not carry them can say which four it wanted.
 */
export const UPDATE_FIELDS = Object.freeze(["local ref", "local object", "remote ref", "remote object"]);

/**
 * @typedef {object} Update
 * @property {string} localRef
 * @property {string} localOid
 * @property {string} remoteRef
 * @property {string} remoteOid
 * @property {string} line the input line, verbatim, for the refusal to quote
 */

/**
 * @typedef {object} Decision
 * @property {"allow" | "block"} verdict
 * @property {string} code
 * @property {string} reason
 * @property {string[]} [notices]
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
 * Run git in `root` and hand back what it said.
 *
 * A FAILURE IS A `problem` AND NEVER AN EMPTY ANSWER, which is
 * `pushRange`'s contract one file over: a caller that cannot tell "git
 * said nothing" from "git could not be run" will read the first as the
 * second, and this guard's whole discipline is about keeping those apart.
 *
 * @param {string} root
 * @param {string[]} argv
 * @returns {{ out: string } | { problem: string }}
 */
export function git(root, argv) {
  /** @type {ReturnType<typeof spawnSync>} */
  let r;
  try {
    r = spawnSync("git", ["-C", root, ...argv], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      maxBuffer: 8 * 1024 * 1024,
    });
  } catch (err) {
    return { problem: `git could not be started (${err instanceof Error ? err.message : String(err)})` };
  }
  if (r.error !== undefined && r.error !== null) {
    return { problem: `git could not be started (${r.error.message})` };
  }
  if (r.status !== 0) {
    const said = String(r.stderr ?? "").trim();
    return {
      problem: `git ${argv.join(" ")} exited ${String(r.status)}${said === "" ? "" : ` (${said})`}`,
    };
  }
  return { out: String(r.stdout ?? "").trim() };
}

/**
 * The proposed updates, as git wrote them.
 *
 * BLANK LINES ARE DROPPED AND EVERY OTHER LINE MUST SPLIT INTO FOUR. A
 * line this reader cannot split is not a shape to guess at: it is an
 * input from a git this file does not know, and the caller refuses it by
 * name rather than judging the fields it happened to recognise.
 *
 * NO UPDATES AT ALL IS NOT AN ERROR. Git runs the hook with empty input
 * when every ref is already up to date, and refusing there would refuse a
 * no-op.
 *
 * @param {string} text
 * @returns {{ updates: Update[] } | { problem: string }}
 */
export function parseUpdates(text) {
  /** @type {Update[]} */
  const updates = [];
  for (const raw of String(text ?? "").split("\n")) {
    const line = raw.replace(/\r$/, "");
    if (line.trim() === "") continue;
    const fields = line.trim().split(/\s+/);
    if (fields.length !== UPDATE_FIELDS.length) {
      return {
        problem:
          `git handed this hook a line carrying ${fields.length} field(s) where a pre-push hook's ` +
          `input carries ${UPDATE_FIELDS.length} (${UPDATE_FIELDS.join(", ")}): ${JSON.stringify(line)}`,
      };
    }
    const [localRef, localOid, remoteRef, remoteOid] = /** @type {[string, string, string, string]} */ (fields);
    updates.push({ localRef, localOid, remoteRef, remoteOid, line });
  }
  return { updates };
}

/**
 * Is this an update shape this guard has a rule for?
 *
 * THE ANSWER IS ABOUT THE REMOTE REF AND THE LOCAL OBJECT, in that
 * order, and the local REF is deliberately not read: `git push origin
 * HEAD:main` names its local side `HEAD`, `git push origin <sha>:main`
 * names it by object id, and neither is a defect. What the update has to
 * carry is a branch on the remote and an object on the local side.
 *
 * @param {Update} update
 * @returns {{ branch: string } | { unsupported: string }}
 */
export function updateShape(update) {
  if (ZERO_OID_RE.test(update.localOid)) {
    return {
      unsupported:
        `a DELETION of ${update.remoteRef} — the local object is all zeros, so this push carries ` +
        "no candidate commit: there is no tree to key a verdict token to and no range to derive " +
        "an owed set from",
    };
  }
  if (!OID_RE.test(update.localOid)) {
    return {
      unsupported:
        `${JSON.stringify(update.localOid)} is not an object id in either of git's hash lengths, ` +
        `so what ${update.remoteRef} would receive cannot be named`,
    };
  }
  if (!update.remoteRef.startsWith(BRANCH_REF_PREFIX)) {
    return {
      unsupported:
        `${update.remoteRef} is not a branch — this guard's range, owed set and verdict token are ` +
        `all rules about ${BRANCH_REF_PREFIX}*, and it has never been given one for anything else`,
    };
  }
  return { branch: update.remoteRef.slice(BRANCH_REF_PREFIX.length) };
}

/**
 * The range one update proposes, as `<old>..<new>`.
 *
 * THREE THINGS MAKE IT UNDERIVABLE AND ALL THREE FAIL CLOSED to the whole
 * battery, which is what `owedSetForPush` does one file over when the
 * branch names no upstream:
 *
 *   A REMOTE OBJECT OF ALL ZEROS — the branch does not exist on the
 *     remote yet, so there is no old object and "what this push ADDS" is
 *     every commit the branch carries.
 *   AN OLD OBJECT THIS CHECKOUT DOES NOT HAVE — the remote moved and
 *     nothing here fetched it, so the two-dot range would be a diff
 *     against an object git cannot read.
 *   AN OLD OBJECT THAT IS NOT AN ANCESTOR — divergent tips, which is
 *     exactly what docs/CONVENTIONS.md's RANGE RULE bans a two-dot diff
 *     between. `push-guard.mjs` states that check at the same place for
 *     the same reason.
 *
 * @param {string} root
 * @param {Update} update
 * @param {typeof git} [run]
 * @returns {{ range: string } | { problem: string }}
 */
export function updateRange(root, update, run = git) {
  if (ZERO_OID_RE.test(update.remoteOid)) {
    return {
      problem:
        `${update.remoteRef} does not exist on the remote yet (its old object is all zeros), so ` +
        "what this push ADDS to the remote is every commit the branch carries and no two-dot " +
        "range names it",
    };
  }
  if (!OID_RE.test(update.remoteOid)) {
    return {
      problem:
        `git named ${update.remoteRef}'s old object ${JSON.stringify(update.remoteOid)}, which is ` +
        "not an object id in either hash length",
    };
  }
  const present = run(root, ["cat-file", "-e", `${update.remoteOid}^{commit}`]);
  if ("problem" in present) {
    return {
      problem:
        `this checkout does not carry ${update.remoteRef}'s old object ${update.remoteOid} ` +
        `(${present.problem}), so the range this push would add cannot be diffed here`,
    };
  }
  const ancestor = run(root, [
    "merge-base",
    "--is-ancestor",
    update.remoteOid,
    update.localOid,
  ]);
  if ("problem" in ancestor) {
    return {
      problem:
        `${update.remoteOid} is not an ancestor of ${update.localOid} (${ancestor.problem}), so ` +
        "these two tips have DIVERGED and docs/CONVENTIONS.md's RANGE RULE bans a two-dot diff " +
        "between them",
    };
  }
  return { range: `${update.remoteOid}..${update.localOid}` };
}

/**
 * The tree the candidate commit carries.
 *
 * THIS IS THE KEY THE WHOLE CARD TURNS ON, so an inability here REFUSES
 * rather than announcing. That is the direction T-216-s8 argued for the
 * case where nothing about a push can be judged, and it is that case: git
 * is being asked to name the tree of an object it is about to SEND, so a
 * failure means the object is not in this repository at all. Every other
 * inability in this family fails open because something was still judged;
 * here nothing is.
 *
 * @param {string} root
 * @param {string} oid
 * @param {typeof git} [run]
 * @returns {{ tree: string } | { problem: string }}
 */
export function candidateTree(root, oid, run = git) {
  const out = run(root, ["rev-parse", "--verify", "--quiet", `${oid}^{tree}`]);
  if ("problem" in out) return { problem: out.problem };
  if (!OID_RE.test(out.out)) {
    return { problem: `git answered ${JSON.stringify(out.out)} for ${oid}^{tree}` };
  }
  return { tree: out.out };
}

/**
 * @typedef {object} UpdateVerdict
 * @property {Update} update
 * @property {"qualified" | "refused"} state
 * @property {string} code
 * @property {string} detail
 * @property {string} [range]      the range that was judged, when one derived
 * @property {string} [tree]       the candidate tree the token was keyed to
 * @property {import("./push-guard.mjs").OwedSet} [owed]
 * @property {string} [owedProblem]
 */

/**
 * Judge ONE proposed update.
 *
 * THE ORDER IS SHAPE, CANDIDATE, RANGE, OWED SET, TOKEN, and every step
 * hands the next one evidence read off the update rather than off HEAD.
 *
 * @param {object} input
 * @param {string} input.root
 * @param {Update} input.update
 * @param {typeof git} [input.run]
 * @param {typeof runOwedSet} [input.owedSet]
 * @param {typeof readToken} [input.token]
 * @returns {UpdateVerdict}
 */
export function judgeUpdate({ root, update, run = git, owedSet = runOwedSet, token = readToken }) {
  const shape = updateShape(update);
  if ("unsupported" in shape) {
    return {
      update,
      state: "refused",
      code: "update-shape-unsupported",
      detail: shape.unsupported,
    };
  }
  const candidate = candidateTree(root, update.localOid, run);
  if ("problem" in candidate) {
    return {
      update,
      state: "refused",
      code: "update-candidate-unreadable",
      detail:
        `git would not name the tree of ${update.localOid}, the object this push would send to ` +
        `${update.remoteRef} (${candidate.problem}) — so there is no key to judge a verdict ` +
        "token against and NOTHING about this update could be measured",
    };
  }
  const range = updateRange(root, update, run);
  const owedRead = "range" in range ? owedSet(root, range.range) : { problem: range.problem };
  const read = token(root);
  const judgement = judgeToken({
    ...("token" in read ? { token: read.token } : { problem: read.problem }),
    tree: candidate.tree,
    // THE ONE WORD THAT WOULD OTHERWISE BE FALSE. `judgeToken`'s
    // sentences name HEAD as the owner of the key because its first
    // caller compares against HEAD's tree; this one compares against the
    // tree of the object being SENT, and a refusal telling a seat its
    // token is stale against "HEAD's tree" when the hash is not HEAD's
    // sends it to look at the wrong commit. The judgement is unchanged —
    // only the noun.
    treeOwner: TREE_OWNER,
    ...("owed" in owedRead ? { owed: owedRead.owed } : {}),
  });
  /** @type {UpdateVerdict} */
  const base = {
    update,
    state: judgement.state === "fresh" ? "qualified" : "refused",
    code: judgement.code,
    detail: judgement.detail,
    tree: candidate.tree,
    ...("range" in range ? { range: range.range } : {}),
    ...("owed" in owedRead ? { owed: owedRead.owed } : { owedProblem: owedRead.problem }),
  };
  return base;
}

/**
 * What one refused update prints.
 *
 * IT NAMES THE RANGE IT JUDGED AND THE TREE IT KEYED TO, because the
 * whole difference between this guard and the one on the other hook is
 * WHICH TREE — and a refusal that does not say which tree it compared
 * sends a seat to look at HEAD's.
 *
 * @param {UpdateVerdict} v
 * @returns {string}
 */
export function refusalLines(v) {
  const owed =
    v.owed !== undefined
      ? `    this update's own range owes ${v.owed.suites.join(", ")}` +
        (v.owed.e2e.whole || v.owed.e2e.specs.length === 0
          ? ""
          : ` (e2e over ${v.owed.e2e.specs.length} spec file(s))`) +
        `, derived from ${v.owed.range}. The narrow run is:\n` +
        `      node tools/e2e/scripts/gate-run.mjs --range ${v.owed.range}\n`
      : v.owedProblem === undefined
        ? ""
        : `    THE OWED SET FOR THIS UPDATE COULD NOT BE DERIVED (${v.owedProblem}), so the WHOLE ` +
          "battery is required — this guard fails closed and never narrows by accident.\n";
  return (
    `  ${v.update.localRef} ${v.update.localOid} -> ${v.update.remoteRef} ${v.update.remoteOid}\n` +
    `    [${v.code}] ${v.detail}.\n` +
    (v.tree === undefined ? "" : `    judged against the PUSHED commit's tree ${v.tree}, which is the tree this update would put on the remote.\n`) +
    owed
  );
}

/**
 * @typedef {object} Request
 * @property {string} [cwd]      where git ran the hook, which is the checkout
 * @property {string} [stdin]    the proposed updates, verbatim
 * @property {string} [remote]   the remote's name or URL, as git's argv gave it
 */

/**
 * The whole decision.
 *
 * READ THE ORDER. Everything before the update loop is about whether this
 * checkout is one this guard has anything to say about; everything after
 * it is `push-guard.mjs`'s existing arms, asked here because a push that
 * never passed through a `Bash` tool call never met them.
 *
 * @param {Request} request
 * @param {object} [seams]
 * @param {typeof git} [seams.run]
 * @param {typeof runOwedSet} [seams.owedSet]
 * @param {typeof readToken} [seams.token]
 * @param {(root: string) => import("./push-guard.mjs").CheckResult} [seams.check]
 * @param {(root: string) => import("./push-guard.mjs").CheckResult} [seams.cheap]
 * @param {typeof holderVerdict} [seams.holder]
 * @returns {Decision}
 */
export function decidePrePush(request, seams = {}) {
  /** @type {string[]} */
  const notices = [];
  const decision = decideWith(request, seams, notices);
  return notices.length === 0 ? decision : { ...decision, notices };
}

/**
 * @param {Request} request
 * @param {NonNullable<Parameters<typeof decidePrePush>[1]>} seams
 * @param {string[]} notices
 * @returns {Decision}
 */
function decideWith(request, seams, notices) {
  const run = seams.run ?? git;
  const cwd = typeof request.cwd === "string" && request.cwd !== "" ? request.cwd : process.cwd();
  const root = findCheckoutRoot(cwd);
  if (root === undefined) {
    return allow("not-a-repository", `${cwd} sits in no git checkout, so there is nothing to judge`);
  }
  // IS THIS OUR REPOSITORY — the sixth criterion of the guard this file
  // stands beside: outside this repository's own checkouts it does not
  // fire and does not narrate. A hook installed by pointing
  // `core.hooksPath` at a directory CAN be reached from a checkout that
  // is not ours, which is exactly why the question is asked rather than
  // assumed from the fact that the hook ran.
  const manifest = path.join(root, INDEX_CRATE_MANIFEST_REL_PATH);
  const inside = run(root, ["rev-parse", "--show-toplevel"]);
  if ("problem" in inside) {
    notices.push(
      `WHETHER ${root} IS A CHECKOUT OF THIS REPOSITORY WAS NOT ESTABLISHED: ${inside.problem}. ` +
        "Every arm below judges this tree as though it IS ours; an inability is announced rather " +
        "than turned into a silent allow.",
    );
  } else if (!probe(manifest)) {
    return allow(
      "not-this-repository",
      `${root} carries no ${INDEX_CRATE_MANIFEST_REL_PATH}, so none of this guard's questions can ` +
        "be asked here",
    );
  }

  const parsed = parseUpdates(request.stdin ?? "");
  if ("problem" in parsed) {
    return block(
      "update-input-unreadable",
      "PUSH REFUSED — NOTHING ABOUT THIS PUSH COULD BE JUDGED: this hook could not read the " +
        `updates git handed it. ${parsed.problem}\n` +
        "  A pre-push hook is given one line per proposed update and this guard judges each one " +
        "on its own two objects. An input it cannot split is not a shape to guess at, and a guess " +
        "here would attach a verdict to a range nobody named.",
    );
  }
  if (parsed.updates.length === 0) {
    // GIT RUNS THE HOOK WITH NO LINES when everything is already up to
    // date. Announced rather than silent: this file's standing rule is
    // that an allow which left something unverified says so, and a push
    // nothing was measured about is squarely that.
    return allow(
      "no-updates-proposed",
      "NOTHING WAS JUDGED: git handed this hook no proposed updates, which is what it does when " +
        "every ref is already up to date. The push is allowed and nothing here has measured " +
        "anything.",
    );
  }

  // ── WHO HOLDS THIS CHECKOUT? (T-238's arm, asked here too) ────────
  // The same three verdicts and the same one refusal. It is asked FIRST,
  // before any tree is judged, because every verdict below is about a
  // tree this session may have no standing to push at all.
  const headRef = readHeadRef(root);
  const holder = seams.holder ?? holderVerdict;
  const seat = holder({ root, integrationRef: INTEGRATION_BRANCH, headRef });
  if (seat.state === "held") {
    return block(
      "holder-live-elsewhere",
      `PUSH REFUSED: ${seat.detail}\n` +
        "  A push from a checkout somebody else is sitting in is lane-protocol rule 4's " +
        `collision. This guard reads ${HOLDER_REL_PATH}, and the process it names is RUNNING ` +
        "right now — checked by pid AND start time.\n" +
        "  If that session is in fact gone, this refusal retires itself the moment its process " +
        "does; nothing needs deleting by hand.",
    );
  }
  if (seat.state === "dead" || seat.state === "unknown") {
    notices.push(`THE INTEGRATION SEAT: ${seat.detail} The push is allowed and the seat is unjudged.`);
  }

  // ── THE LANDING GATE (T-212's arms, on this hook too) ─────────────
  // A REFUSAL RETURNS and a cannot-compare is a NOTICE, which is the
  // asymmetry `push-guard.mjs` argues at length: a path outside its
  // fence must not land whatever else is true, and a fence this gate
  // could not expand must not silently retire the arms below it.
  if (headRef !== undefined && LANE_BRANCH_RE.test(headRef)) {
    const landing = laneLandingVerdict(root, headRef);
    if (landing.verdict === "block") return landing;
    if (ANNOUNCED_ALLOW_CODES.includes(landing.code)) notices.push(landing.reason);
  } else if (headRef === `refs/heads/${INTEGRATION_BRANCH}`) {
    const landing = mergeLandingVerdict(root, headRef);
    if (landing.verdict === "block") return landing;
    if (ANNOUNCED_ALLOW_CODES.includes(landing.code)) notices.push(landing.reason);
  }

  // ── THE CHEAP CHECKS (T-203's arm) ────────────────────────────────
  const cheapResult = (seams.cheap ?? runCheapChecks)(root);
  if (cheapResult.status === CHEAP_CHECKS_EXIT.FOUND) {
    return block(
      "cheap-checks-found",
      "PUSH REFUSED: the cheap pre-push checks FOUND something.\n" +
        "  their own report follows, VERBATIM:\n" +
        `${indent(cheapResult.stderr || cheapResult.stdout)}`,
    );
  }
  if (cheapResult.status !== CHEAP_CHECKS_EXIT.CLEAN) {
    notices.push(
      `THE CHEAP CHECKS DID NOT ANSWER: ${cheapResult.problem ?? `push-checks.mjs exited ${String(cheapResult.status)}`}` +
        ". The push is allowed and the board is UNJUDGED.",
    );
  }

  // ── EVERY PROPOSED UPDATE, EACH ON ITS OWN TWO OBJECTS (T-314) ────
  /** @type {UpdateVerdict[]} */
  const judged = parsed.updates.map((update) =>
    judgeUpdate({
      root,
      update,
      run,
      ...(seams.owedSet === undefined ? {} : { owedSet: seams.owedSet }),
      ...(seams.token === undefined ? {} : { token: seams.token }),
    }),
  );
  const refused = judged.filter((v) => v.state === "refused");
  if (refused.length > 0) {
    const qualified = judged.filter((v) => v.state === "qualified");
    return block(
      refused.length === 1 ? /** @type {UpdateVerdict} */ (refused[0]).code : "updates-refused",
      `PUSH REFUSED: ${refused.length} of ${judged.length} proposed update(s) are not qualified ` +
        "to land.\n" +
        "  A push is a claim that the gates were run against what it CARRIES. This hook is what " +
        "makes that a fact rather than a claim, and git runs it whatever session typed the push.\n" +
        refused.map(refusalLines).join("") +
        (qualified.length === 0
          ? ""
          : `  AND THE WHOLE PUSH IS REFUSED, INCLUDING THE ${qualified.length} UPDATE(S) THAT ` +
            "WOULD HAVE QUALIFIED — a pre-push hook has one exit code for the whole invocation, " +
            "so git refuses all of them together:\n" +
            qualified
              .map((v) => `    ${v.update.localRef} -> ${v.update.remoteRef} [${v.code}]\n`)
              .join("")) +
        "  Run the blessed gate-runner from the repository root against the range above, then " +
        "push:\n" +
        "    node tools/e2e/scripts/gate-run.mjs --all\n" +
        `  It writes ${TOKEN_REL_PATH}, keyed by the tree it ran against. RUN IT LAST: a commit ` +
        "made after a green run changes the tree and stales the token.\n" +
        "  There is no override flag here, deliberately — `--no-verify` skips this hook entirely " +
        "and docs/CONVENTIONS.md records that bypass as closed by procedure rather than pretended " +
        "away.",
    );
  }

  // ── THE GRAPH, LAST AND ONLY FOR A PUSH THAT GOT THIS FAR ─────────
  // `push-guard.mjs`'s ordering and its two lane arms, unchanged: a lane
  // whose fence cannot reach the graph has no legal remedy for a graph
  // refusal, and refusing it would be a guard somebody disables.
  if (headRef !== undefined && LANE_BRANCH_RE.test(headRef)) {
    const read = readManifest(root);
    if ("problem" in read) {
      return allow(
        "lane-fence-unreadable",
        `${root} is on the lane branch ${headRef} and its fence manifest could not be read ` +
          `(${read.problem}), so whether the lane could regenerate the graph inside its fence is ` +
          "not derivable — and an unanswerable question is an allow here",
      );
    }
    if (!laneCanRegenerate(read.manifest)) {
      return allow(
        "lane-cannot-regenerate",
        `${read.manifest.taskId}'s fence (${read.manifest.touchesLine}) does not reach ` +
          `${GRAPH_REL_PATH}, so this lane cannot regenerate the graph inside it and the regen is ` +
          "the integrator's at the merge (docs/CONVENTIONS.md, GRAPH REGEN)",
      );
    }
  }
  const result = (seams.check ?? runCheck)(root);
  if (result.status === CHECK_EXIT.STALE) {
    return block(
      "graph-stale",
      "PUSH REFUSED: `index --check` exited 1 — the committed graph is STALE.\n" +
        "  the check's own report follows, VERBATIM:\n" +
        `${indent(result.stdout || result.stderr)}` +
        `  then re-run the check from ${CHECK_DIR_REL_PATH}/ and push again:\n` +
        `    cargo ${CHECK_ARGV.join(" ")}`,
    );
  }
  if (result.status !== CHECK_EXIT.CURRENT) {
    notices.push(
      `THE GRAPH WAS NOT ASKED SUCCESSFULLY: ${result.problem ?? `\`index --check\` exited ${String(result.status)}`}` +
        `, and only exit ${CHECK_EXIT.STALE} means STALE. The push is allowed and the graph is ` +
        "UNVERIFIED.",
    );
  }
  return allow(
    "updates-qualified",
    `${judged.length} proposed update(s) judged against their own pushed trees: ` +
      judged.map((v) => `${v.update.remoteRef} at ${String(v.tree).slice(0, 12)}`).join(", "),
  );
}

/**
 * Does `p` exist?
 *
 * A PROBE THAT COULD NOT LOOK IS TREATED AS PRESENT, which is T-238-s1's
 * direction one file over: an inability must not become the silent allow
 * that `not-this-repository` is. ENOENT and ENOTDIR are the file being
 * absent; every other errno is this guard being unable to look, and it
 * answers so.
 *
 * @param {string} p
 * @returns {boolean}
 */
export function probe(p) {
  try {
    statSync(p);
    return true;
  } catch (err) {
    const e = /** @type {NodeJS.ErrnoException} */ (err);
    return !(e && (e.code === "ENOENT" || e.code === "ENOTDIR"));
  }
}

/**
 * Quote a captured report without letting it impersonate this guard's own
 * sentences — every line moves right by four columns.
 *
 * @param {string} text
 * @returns {string}
 */
function indent(text) {
  const body = String(text ?? "").replace(/\s+$/, "");
  if (body === "") return "";
  return `${body
    .split("\n")
    .map((l) => `    ${l}`)
    .join("\n")}\n`;
}
