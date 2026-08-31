/**
 * THE LANDING GATE (T-212) — nothing out-of-fence may LAND, at either
 * moment it could.
 *
 * **THE COMPLETE ACCOUNT OF WHAT A LANE WROTE IS ITS COMMITTED DIFF.**
 * `T-025-s4` proved that deciding what an arbitrary shell command will
 * write is not a parsing problem this project will win, and `T-199`'s
 * write-time fence sees only writes made with the write TOOLS — a
 * redirect, a `sed -i` or a script goes straight past it. This module is
 * the layer above both, and the only one whose coverage is total by
 * construction: whatever wrote a file, only COMMITTED content can land,
 * and committed content is fully visible in `git diff --name-only`. The
 * outcome is judged, never the intention.
 *
 * ── THE TWO MOMENTS ──────────────────────────────────────────────────
 * `laneLandingVerdict` answers a push of a LANE branch: the lane's own
 * merge-base-to-tip diff against the fence its card declares on main.
 * `mergeLandingVerdict` answers a push of the INTEGRATION branch: every
 * merge commit the push would carry, each judged over its own lane's
 * range with the fence read from the merge's FIRST parent. They are one
 * containment rule at two call sites, and the rule is `within`.
 *
 * ── THE FENCE COMES FROM MAIN AND FROM NOWHERE ELSE ──────────────────
 * Not from `.nputer/lane-fence.json`, which lives IN the lane and which
 * a lane can rewrite. Not from the lane's own copy of its card at any
 * tip, because `method/lane-protocol.md` rule 5 rules that "a fence is
 * not widened from inside the lane it fences" and a gate reading a card
 * the lane authored is precisely that widening. From
 * `git show <integration>:docs/tasks/…`, a ref the lane cannot move —
 * and exactly where a legitimate widening lands, since the widening act
 * is a card amendment COMMITTED on main plus a re-run of `--write-fence`
 * (`T-211`).
 *
 * **THE LANE'S OWN CARD IS STILL ITS OWN TO WRITE**, and that is not a
 * contradiction: rule 5 puts every card outside every fence including its
 * own, so a lane's status stamp and its implementation notes are protocol
 * writes that this gate admits to the diff and reads nothing from.
 *
 * ── ONE IMPLEMENTATION, IMPORTED, AT EVERY LAYER (T-057) ─────────────
 * The containment test is `within` from `lane-fence.mjs` — T-209's own
 * ruling, which built the fence-versus-fence comparison out of the
 * parser's `compareFences`/`sharedDomain` and left `within` for THIS call
 * site, where the question is one-directional: a PATH against a FENCE,
 * not a fence against a fence. The lane branch spelling is
 * `LANE_BRANCH_RE`. The frontmatter read is `frontmatterLineOf`. The
 * expansion is the parser's own `expandFence`, reached through
 * `expand-fence.mjs` for the reason that file's header gives. Nothing
 * here re-derives any of them.
 *
 * ── THREE ANSWERS, NEVER TWO ─────────────────────────────────────────
 * Rule 5: "an unresolved token is not disjoint from everything … a fence
 * that answers 'no overlap' when it means 'I do not know' is worse than
 * one that refuses. Three verdicts, never two." So this module answers
 * `in-fence` (proved), `outside-the-fence` (proved, and it REFUSES) and
 * CANNOT COMPARE — and it never spells the third as the first. What it
 * does with the third is the next paragraph, and it is the one decision
 * here worth attacking.
 *
 * ── WHY CANNOT-COMPARE ALLOWS, LOUDLY, AND WHERE THAT IS WRONG ───────
 * `push-guard.mjs`'s header argues its fail-open contract at length and
 * this arm keeps it: "the seat that pushes is the seat that dispatches,
 * merges and checkpoints; a guard that can halt it on its own inability
 * halts the project, and the first person it inconveniences turns it
 * off." A cannot-compare here is announced on stderr through
 * `ANNOUNCED_ALLOW_CODES`, names the tokens it could not resolve and the
 * paths it therefore could not judge, and never claims the diff was
 * clean.
 *
 * **THE COST IS MEASURED AND IT IS NOT SMALL.** A SLUG token
 * (`app-shell`, `app-agent`, `crate-index`, …) cannot be expanded inside
 * the hook budget, because the slug map is each component file's
 * `touch_slugs:` field and reading it needs `yaml`. On the live board
 * those tokens are common, so a slug-fenced lane gets its RESOLVED
 * domains enforced and an announcement for everything else. Closing that
 * is `T-222`, routed rather than taken: it wants the slug map published
 * in a form the hook budget can read, which is a change to what
 * `--write-fence` commits and belongs with `T-211`'s fast paths.
 *
 * ── AND `T-221` IS NARROWER THAN IT READS, MEASURED HERE ─────────────
 * That card says dropping the `/` from the parser's `sharedDomain` reds
 * NOTHING in the repository, and names this card as a third consumer
 * arriving on the same primitive. TRUE OF `sharedDomain`; NOT true of
 * `within`, which is the primitive THIS call site actually spends.
 * Drilled: dropping `within`'s separator reds two bodies by name —
 * `lane-fence.spec.ts`'s "a name that merely starts the same is not
 * inside", which pre-dates this card, and this card's own containment
 * body. So `T-221`'s hole is `lib/parser`'s alone, and this gate does
 * not widen it.
 *
 * ── WHAT THIS GATE CANNOT SEE, STATED SO IT IS NOT OVERSOLD ──────────
 * 1. **A lane writing ANOTHER lane's worktree never appears in its own
 *    diff.** That vector is `T-210`'s, and the two cards state each
 *    other's blind spots on purpose.
 * 2. It keys on the CHECKOUT's HEAD, exactly as `push-guard.mjs`'s
 *    existing lane arm does. A push of some ref that is not HEAD is not
 *    seen. So is a push from a checkout whose root this hook resolves
 *    wrongly — `T-216`, open, and it governs both arms of this file's
 *    host equally.
 * 3. It reads COMMITTED content only. Uncommitted work cannot land and is
 *    not the question.
 * 4. A push reached through an alias, a function, a script or an `eval`
 *    is not seen at all, which is `gitInvocations`' declared ceiling and
 *    the pre-guard state rather than a regression from it.
 */

import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { LANE_BRANCH_RE, frontmatterLineOf, within } from "./lane-fence.mjs";

/**
 * This project's integration branch, held here and COMPARED rather than
 * trusted.
 *
 * docs/CONVENTIONS.md's lane bullet publishes it — "integration branch
 * `main`; branch `task/T-NNN-<slug>`" — and `landing-gate.spec.ts` reads
 * that bullet through `laneSpellings`, the module that owns the fact, and
 * compares it against this constant. That is the treatment
 * `LANE_BRANCH_RE` and `GRAPH_REL_PATH` already get: the constant is
 * checked against the program or the document that owns it, so a rename
 * reds a body by name instead of going quiet.
 */
export const INTEGRATION_BRANCH = "main";

/**
 * Every spelling of the integration branch a checkout might hold, in the
 * order to try them.
 *
 * WHICH ONE RESOLVES IS A LIVE FACT AND NOT A PREFERENCE (T-153-s9,
 * measured): `actions/checkout` on a `pull_request` event leaves the
 * workspace detached and creates no local branch, so the bare name
 * resolves to nothing on exactly the CI event a lane can fire. A read
 * site that spelled `origin/main` instead would break every checkout with
 * no remote. `dispatch-brief.mjs` owns this list; this is the hook-budget
 * copy and `landing-gate.spec.ts` asserts the two are identical, so a
 * fourth candidate added there reds a body here.
 *
 * @param {string} branch
 * @returns {string[]}
 */
export function integrationRefCandidates(branch) {
  return [branch, `origin/${branch}`, `refs/remotes/origin/${branch}`];
}

/**
 * Where the REMOTE's copy of the integration branch is looked for, which
 * is a different question from the one above.
 *
 * The merge arm needs to know which commits a push would ADD, and only a
 * remote-tracking ref answers that. The local branch is the thing being
 * pushed, so including it would compare main against itself and find no
 * new merge at all — an arm that always answers "nothing to judge" is an
 * arm no mutation can kill.
 *
 * @param {string} branch
 * @returns {string[]}
 */
export function remoteRefCandidates(branch) {
  return [`refs/remotes/origin/${branch}`, `origin/${branch}`];
}

/**
 * A card file, and the id its NAME carries.
 *
 * THE FILENAME IS AUTHORITATIVE FOR LOCATING A CARD, and that is a
 * measurement rather than a hope: over the 420 cards live at this card's
 * base, the frontmatter `id:` and this pattern's capture agree **420
 * times and disagree 0**, and the board runs exactly two id shapes,
 * `T-N` and `T-N-sN`. `landing-gate.spec.ts` re-measures it over the
 * whole of `docs/tasks/` rather than trusting the figure.
 *
 * Locating by name is what keeps this arm from reading 420 files on a
 * push to answer one question.
 */
export const CARD_FILE_RE = /^docs\/tasks\/(T-\d+(?:-s\d+)?)-[^/]*\.md$/;

/**
 * THE SUFFIX IS PART OF THE ID (`normaliseTaskId`'s own comment, bought
 * at the T-153-s5 dispatch where `--write-fence` stamped T-153's fence
 * into an s5 lane). `LANE_BRANCH_RE` captures `(\d+)` only, so reading
 * the id off ITS capture would answer `T-163` for `task/T-163-s4-lane`
 * and fence the lane with its PARENT's card. This matcher takes the
 * suffix when the branch carries one.
 */
export const LANE_ID_RE = /^refs\/heads\/task\/(T-\d+(?:-s\d+)?)-/;

/**
 * The card ids a lane branch could name, MOST SPECIFIC FIRST.
 *
 * `task/T-163-s4-lane` names `T-163-s4` if such a card exists and
 * `T-163` otherwise — the same preference the published branch matcher
 * makes, for the same reason. Returning both and resolving against the
 * board is what makes the preference a lookup rather than a guess.
 *
 * @param {string} headRef a full ref
 * @returns {string[]}
 */
export function laneCardIds(headRef) {
  const m = LANE_ID_RE.exec(headRef);
  if (m === null) return [];
  const specific = /** @type {string} */ (m[1]);
  const parent = /^(T-\d+)-s\d+$/.exec(specific);
  return parent === null ? [specific] : [specific, /** @type {string} */ (parent[1])];
}

/**
 * @typedef {object} Ran
 * @property {number | null} status
 * @property {string} stdout
 * @property {string} stderr
 */

/**
 * Run one git command and hand back what it said. NEVER THROWS and never
 * interprets: every caller reads the status itself, because the
 * difference between "git answered no" and "git could not be run" is the
 * difference between a verdict and a cannot-compare.
 *
 * @param {string} root
 * @param {string[]} args
 * @returns {Ran}
 */
export function runGit(root, args) {
  try {
    const out = spawnSync("git", ["-C", root, ...args], {
      encoding: "utf8",
      maxBuffer: 32 * 1024 * 1024,
    });
    if (out.error !== undefined && out.error !== null) {
      return { status: null, stdout: "", stderr: out.error.message };
    }
    return {
      status: out.status,
      stdout: String(out.stdout ?? ""),
      stderr: String(out.stderr ?? ""),
    };
  } catch (err) {
    return { status: null, stdout: "", stderr: err instanceof Error ? err.message : String(err) };
  }
}

/** The expander this module drives — see `expand-fence.mjs` beside it. */
export const EXPANDER_PATH = fileURLToPath(new URL("./expand-fence.mjs", import.meta.url));

/**
 * @typedef {object} ExpandedFence
 * @property {string[]} paths       domains the fence reserves
 * @property {string[]} excluded    domains carved out — the card's own file
 * @property {string[]} unusable    raw tokens the expansion could not resolve
 * @property {string[]} unfenceable the parser's own `UNFENCEABLE_PATHS`
 */

/**
 * Expand a `touches:` token list through the project's ONE expansion.
 *
 * @param {{ touches: string[], id?: string, file?: string }} request
 * @returns {{ fence: ExpandedFence } | { problem: string }}
 */
export function expandTouches(request) {
  /** @type {ReturnType<typeof spawnSync>} */
  let out;
  try {
    out = spawnSync(process.execPath, [EXPANDER_PATH], {
      input: JSON.stringify(request),
      encoding: "utf8",
      maxBuffer: 8 * 1024 * 1024,
    });
  } catch (err) {
    return { problem: `the fence expander could not be started (${err instanceof Error ? err.message : String(err)})` };
  }
  if (out.error !== undefined && out.error !== null) {
    return { problem: `the fence expander could not be started (${out.error.message})` };
  }
  if (out.status !== 0) {
    return {
      problem:
        `the fence expander exited ${String(out.status)} — ${String(out.stderr ?? "").trim() ||
          "it said nothing"}`,
    };
  }
  /** @type {unknown} */
  let parsed;
  try {
    parsed = JSON.parse(String(out.stdout ?? ""));
  } catch (err) {
    return { problem: `the fence expander printed no readable JSON (${err instanceof Error ? err.message : String(err)})` };
  }
  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
    return { problem: "the fence expander printed no object" };
  }
  const obj = /** @type {Record<string, unknown>} */ (parsed);
  /** @param {unknown} v @returns {v is string[]} */
  const isStrings = (v) => Array.isArray(v) && v.every((x) => typeof x === "string");
  const { paths, excluded, unusable, unfenceable } = obj;
  if (!isStrings(paths) || !isStrings(excluded) || !isStrings(unusable) || !isStrings(unfenceable)) {
    return { problem: "the fence expander's answer is missing a field this gate needs" };
  }
  return { fence: { paths, excluded, unusable, unfenceable } };
}

/**
 * The tokens a `touches:` line declares.
 *
 * ── ONE SPELLING, AND EVERYTHING ELSE IS A CANNOT-COMPARE ────────────
 * This reads exactly one shape: a single-line flow sequence,
 * `touches: [a, b]`. Measured at this card's base over every live card
 * that declares one — **317 of 317** match `^touches: \[[^]]*\]$`, and
 * not one carries a quote. A block sequence, a quoted scalar or a
 * continuation is answered `problem`, which becomes CANNOT COMPARE, never
 * an empty fence: an empty fence would be the widest possible refusal on
 * a card this reader simply did not understand, and a fence read wrong is
 * worse than a fence not read. `landing-gate.spec.ts` re-measures the
 * board rather than trusting that figure, so the day a card is written in
 * block form the body reds and this reader is extended deliberately.
 *
 * AN ABSENT OR EMPTY LIST IS NOT A PROBLEM — it is an ANSWER, and the
 * caller turns it into the universal set's dual. See `laneLandingVerdict`.
 *
 * @param {string | undefined} line the verbatim `touches:` line, or none
 * @returns {{ tokens: string[] } | { problem: string }}
 */
export function touchesTokens(line) {
  if (line === undefined) return { tokens: [] };
  const body = line.replace(/^touches:/, "").trim();
  if (body === "") return { tokens: [] };
  const flow = /^\[(.*)\]$/.exec(body);
  if (flow === null) {
    return {
      problem:
        `its \`touches:\` line is ${JSON.stringify(line)}, which is not the single-line flow ` +
        "sequence (`touches: [a, b]`) this gate reads — every live card uses that shape and this " +
        "reader will not guess at another one",
    };
  }
  return {
    tokens: /** @type {string} */ (flow[1])
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t !== ""),
  };
}

/**
 * The card one lane's branch names, AS COMMITTED at `rev`.
 *
 * @param {string} root
 * @param {string} rev       the revision to read the board at
 * @param {string[]} ids     candidate ids, most specific first
 * @param {(root: string, args: string[]) => Ran} [git]
 * @returns {{ id: string, file: string } | { noBoard: string } | { problem: string }}
 */
export function cardAt(root, rev, ids, git = runGit) {
  if (ids.length === 0) return { problem: "its branch names no task id this gate can read" };
  const ls = git(root, ["ls-tree", "-r", "--name-only", "-z", rev, "--", "docs/tasks"]);
  if (ls.status !== 0) {
    return {
      problem: `\`git ls-tree ${rev} -- docs/tasks\` failed (${ls.stderr.trim() || "no message"})`,
    };
  }
  const files = ls.stdout.split("\0").filter((f) => f !== "");
  // NO BOARD AT ALL IS NOT A MISSING CARD, AND THE DIFFERENCE IS THE ONE
  // THIS FUNCTION EXISTS TO DRAW. A checkout whose integration branch
  // carries no `docs/tasks` cards is not this project's board — a
  // fixture, another repository, this repository before its first card —
  // and the gate has NO QUESTION to ask there, exactly as
  // `push-guard.mjs` has none in a checkout carrying no indexer crate.
  // A board that DOES carry cards and carries none for this lane is a
  // different thing entirely: a dispatch error, and the caller refuses
  // it. Collapsing the two would either refuse every fixture or hand a
  // lane the bypass of naming a branch no card answers to.
  if (files.filter((f) => CARD_FILE_RE.test(f)).length === 0) {
    return { noBoard: `${rev} carries no cards under docs/tasks/ at all` };
  }
  for (const id of ids) {
    const matches = files.filter((f) => {
      const m = CARD_FILE_RE.exec(f);
      return m !== null && m[1] === id;
    });
    if (matches.length === 1) return { id, file: /** @type {string} */ (matches[0]) };
    if (matches.length > 1) {
      return {
        problem:
          `${rev} carries ${matches.length} cards whose name declares ${id} ` +
          `(${matches.join(", ")}), so which card fences this lane is ambiguous`,
      };
    }
  }
  return {
    problem: `${rev} carries no card named for ${ids.join(" or ")} under docs/tasks/`,
  };
}

/**
 * @typedef {object} Judged
 * @property {string[]} outside every changed path outside the fence
 * @property {string[]} inside  every changed path the fence admits
 */

/**
 * The one-directional containment question, asked once per changed path.
 *
 * THE ORDER IS THE WRITE-TIME ARM'S, because it is the same ruling: what
 * no card may fence comes first (rule 5's unfenceable directory, where
 * every card's dispatch and closing stamp is written), then the card's
 * own file which is outside every fence including its own, then the fence
 * proper.
 *
 * @param {string[]} paths
 * @param {ExpandedFence} fence
 * @returns {Judged}
 */
export function judgePaths(paths, fence) {
  const domains = [...fence.unfenceable, ...fence.excluded, ...fence.paths];
  /** @type {string[]} */
  const outside = [];
  /** @type {string[]} */
  const inside = [];
  for (const rel of paths) {
    (domains.some((d) => within(rel, d)) ? inside : outside).push(rel);
  }
  return { outside, inside };
}

/**
 * The paths a range committed, MERGE-BASE-to-tip.
 *
 * **NEVER base-at-cut-to-tip**, and that is what keeps a lane which
 * legitimately performed a checkpoint sync (`T-211`'s fast path B) from
 * being charged with MAIN's own paths: the merge-base moves past them the
 * moment the sync lands, so main's work leaves the range by itself.
 *
 * `--no-renames` on purpose. With rename detection a file MOVED out of
 * the fence appears under its new name only, and the write that deleted
 * it inside the fence disappears from the account. Both halves of a
 * rename are writes and this gate judges both. `-z` on purpose too: git
 * QUOTES a path carrying a space or a quote in its ordinary output, and a
 * quoted path is a different string from the one a fence domain would
 * contain.
 *
 * @param {string} root
 * @param {string} base the left endpoint's revision
 * @param {string} tip  the right endpoint's revision
 * @param {(root: string, args: string[]) => Ran} [git]
 * @returns {{ mergeBase: string, paths: string[] } | { problem: string }}
 */
export function rangePaths(root, base, tip, git = runGit) {
  const mb = git(root, ["merge-base", base, tip]);
  if (mb.status !== 0 || mb.stdout.trim() === "") {
    return {
      problem:
        `\`git merge-base ${base} ${tip}\` gave no answer (${mb.stderr.trim() || "no message"}), ` +
        "and this gate computes the diff merge-base-to-tip or not at all",
    };
  }
  const mergeBase = mb.stdout.trim();
  const diff = git(root, ["diff", "--name-only", "-z", "--no-renames", `${mergeBase}..${tip}`]);
  if (diff.status !== 0) {
    return { problem: `\`git diff ${mergeBase}..${tip}\` failed (${diff.stderr.trim() || "no message"})` };
  }
  return { mergeBase, paths: diff.stdout.split("\0").filter((p) => p !== "") };
}

/**
 * The route a refused push takes. A REFUSAL THAT DOES NOT SAY WHAT
 * ESCAPED SENDS THE SEAT BACK TO GUESSING, which is this card's fourth
 * build step; the paths are named by the caller and this is the sentence
 * after them.
 */
export const ROUTE =
  "A fence is not widened from inside the lane it fences (method/lane-protocol.md rule 5), and " +
  "this gate reads the card as committed on the integration branch precisely so that editing the " +
  "card here — or the manifest — cannot move it. An executor whose work reaches outside its own " +
  "`touches:` has found a DISPATCH ERROR and never a licence: record it, route it as a " +
  "`status: suggested` card under docs/tasks/ with `suggested_by:` set, and build the part that " +
  "fits. If the fence itself is wrong, the widening is a card amendment COMMITTED ON MAIN plus a " +
  "re-run of `brief.mjs --task <id> --write-fence <worktree>` (T-211's fast path A) — that is the " +
  "one route that moves this gate, and it is triage's to take, never this hook's.";

/** @param {string} code @param {string} reason */
const allow = (code, reason) => ({ verdict: /** @type {const} */ ("allow"), code, reason });
/** @param {string} code @param {string} reason */
const block = (code, reason) => ({ verdict: /** @type {const} */ ("block"), code, reason });

/**
 * Render a fence for a human, once, so the three refusals below cannot
 * describe it three different ways.
 *
 * @param {string} touchesLine
 * @param {ExpandedFence} fence
 * @returns {string}
 */
function fenceReport(touchesLine, fence) {
  return (
    `  the fence (${touchesLine}) expands to:\n` +
    (fence.paths.length > 0 ? fence.paths.map((p) => `    ${p}\n`).join("") : "    (nothing)\n") +
    `  always writable: ${fence.unfenceable.join(", ")}\n` +
    (fence.excluded.length > 0 ? `  carved out (outside every fence): ${fence.excluded.join(", ")}\n` : "")
  );
}

/**
 * @typedef {object} GateOptions
 * @property {(root: string, args: string[]) => Ran} [git]
 * @property {(request: { touches: string[], id?: string, file?: string }) => ({ fence: ExpandedFence } | { problem: string })} [expand]
 * @property {string} [branch] the integration branch, injectable for a fixture
 */

/**
 * The fence one card declares at one revision, expanded.
 *
 * @param {string} root
 * @param {string} rev
 * @param {{ id: string, file: string }} card
 * @param {GateOptions} opts
 * @returns {{ touchesLine: string, fence: ExpandedFence } | { universalDual: string } | { problem: string }}
 */
export function fenceAt(root, rev, card, opts = {}) {
  const git = opts.git ?? runGit;
  const show = git(root, ["show", `${rev}:${card.file}`]);
  if (show.status !== 0) {
    return { problem: `\`git show ${rev}:${card.file}\` failed (${show.stderr.trim() || "no message"})` };
  }
  const line = frontmatterLineOf(show.stdout, "touches");
  const read = touchesTokens(line);
  if ("problem" in read) return { problem: read.problem };
  if (read.tokens.length === 0) {
    return {
      universalDual:
        line === undefined
          ? `${card.file} declares no \`touches:\` at ${rev}`
          : `${card.file}'s \`touches:\` is empty at ${rev} (${line})`,
    };
  }
  const expanded = opts.expand === undefined
    ? expandTouches({ touches: read.tokens, id: card.id, file: card.file })
    : opts.expand({ touches: read.tokens, id: card.id, file: card.file });
  if ("problem" in expanded) return { problem: expanded.problem };
  return { touchesLine: /** @type {string} */ (line), fence: expanded.fence };
}

/**
 * THE PUSH MOMENT: a lane branch's own diff against its own fence.
 *
 * @param {string} root    the checkout being pushed from
 * @param {string} headRef its HEAD, already known to match `LANE_BRANCH_RE`
 * @param {GateOptions} [opts]
 * @returns {{ verdict: "allow" | "block", code: string, reason: string }}
 */
export function laneLandingVerdict(root, headRef, opts = {}) {
  const git = opts.git ?? runGit;
  const branch = opts.branch ?? INTEGRATION_BRANCH;

  /** @type {string | undefined} */
  let rev;
  const tried = integrationRefCandidates(branch);
  for (const candidate of tried) {
    const probe = git(root, ["rev-parse", "--verify", "--quiet", `${candidate}^{commit}`]);
    if (probe.status === 0 && /^[0-9a-f]{40}$/.test(probe.stdout.trim())) {
      rev = candidate;
      break;
    }
  }
  if (rev === undefined) {
    // NO QUESTION HERE, rather than a question this gate could not
    // answer — so an ORDINARY allow and not an announced one. A checkout
    // with no integration branch is not a checkout whose lanes this gate
    // has anything to say about, which is `push-guard.mjs`'s own
    // `not-this-repository` shape one arm over.
    return allow(
      "landing-gate-no-integration-ref",
      `${root} holds no revision spelling the integration branch ${JSON.stringify(branch)} ` +
        `(asked for ${tried.join(", ")}), so there is no committed card to read a fence from`,
    );
  }

  const card = cardAt(root, rev, laneCardIds(headRef), git);
  if ("noBoard" in card) {
    return allow("landing-gate-no-board", `${card.noBoard}, so no lane here has a fence to read`);
  }
  if ("problem" in card) {
    return block(
      "landing-gate-no-card",
      `PUSH REFUSED: ${headRef} is a lane branch and ${card.problem}.\n` +
        "  A lane's fence is the card's `touches:` AS COMMITTED ON THE INTEGRATION BRANCH, and a " +
        "lane whose card is not there has no fence at all — which is a dispatch error, not a wide " +
        "fence. The least careful card must not get the widest licence (T-209's rule 2).\n" +
        `  ${ROUTE}`,
    );
  }

  const read = fenceAt(root, rev, card, { ...opts, git });
  if ("problem" in read) {
    return allow(
      "landing-gate-cannot-compare",
      `THE LANDING GATE DID NOT JUDGE THIS PUSH: ${card.file} at ${rev} could not be expanded — ` +
        `${read.problem}. The push is allowed and the diff is UNJUDGED — a fence that cannot be ` +
        "read is not a fence that admits everything, and this guard says so rather than " +
        "pretending it looked.",
    );
  }

  const range = rangePaths(root, rev, "HEAD", git);
  if ("problem" in range) {
    return allow(
      "landing-gate-cannot-compare",
      `THE LANDING GATE DID NOT JUDGE THIS PUSH: ${range.problem}. The push is allowed and the ` +
        "diff is UNJUDGED.",
    );
  }

  if ("universalDual" in read) {
    return block(
      "landing-gate-no-fence",
      `PUSH REFUSED: ${read.universalDual}.\n` +
        "  A card with an ABSENT or EMPTY `touches:` is the universal set's DUAL at this gate: it " +
        "reserves nothing, so every changed path is outside it and the push is refused WHOLE. " +
        "Deleting the declaration must not be the bypass, and the least careful card must not get " +
        "the widest licence (T-209's rule 2, same reasoning).\n" +
        `  the range judged: ${range.mergeBase}..HEAD (merge-base-to-tip, ${range.paths.length} path(s))\n` +
        `  ${ROUTE}`,
    );
  }

  const judged = judgePaths(range.paths, read.fence);
  if (judged.outside.length === 0) {
    return allow(
      "landing-gate-inside-the-fence",
      `every path ${card.id}'s range committed is inside its fence (${range.paths.length} path(s), ` +
        `merge-base ${range.mergeBase})`,
    );
  }
  if (read.fence.unusable.length > 0) {
    return allow(
      "landing-gate-cannot-compare",
      `THE LANDING GATE DID NOT JUDGE ${judged.outside.length} PATH(S): ${card.id}'s fence carries ` +
        `token(s) this gate could not resolve — ${read.fence.unusable.join(", ")}.\n` +
        "  A token that resolves to nothing is not `disjoint from everything` " +
        "(method/lane-protocol.md rule 5), so a path outside the RESOLVED domains cannot be " +
        "called out-of-fence: it may sit inside a domain that token stands for. The expansion " +
        "reads no component slug map inside the hook's dependency budget (T-220).\n" +
        fenceReport(read.touchesLine, read.fence) +
        `  the range judged: ${range.mergeBase}..HEAD\n` +
        "  paths NOT judged:\n" +
        judged.outside.map((p) => `    ${p}\n`).join("") +
        "  The push is allowed and those paths are UNJUDGED — which is not a claim that they are " +
        "inside the fence.",
    );
  }
  return block(
    "landing-gate-outside-the-fence",
    `PUSH REFUSED: ${judged.outside.length} committed path(s) are outside ${card.id}'s fence.\n` +
      `  the card, as committed on ${rev}: ${card.file}\n` +
      fenceReport(read.touchesLine, read.fence) +
      `  the range judged: ${range.mergeBase}..HEAD (merge-base-to-tip, never base-at-cut-to-tip, ` +
      "so a checkpoint sync is not charged with main's own paths)\n" +
      "  the paths refused:\n" +
      judged.outside.map((p) => `    ${p}\n`).join("") +
      `  ${ROUTE}`,
  );
}

/**
 * THE MERGE MOMENT: every merge commit a push of the integration branch
 * would carry, judged over ITS OWN lane's range.
 *
 * ── THE ORDERING IS WHAT PRESERVES NO-SELF-WIDENING ──────────────────
 * For a merge `M` of a lane, the fence is read from `M^1` — main BEFORE
 * the merge — and the diff is `merge-base(M^1, M^2)..M^2`, the lane's own
 * contribution. Read from `M` itself, or from `M^2`, the fence would be
 * whatever the lane's own card said after the lane edited it, and the
 * merge would be a lane widening its own gate one commit later than the
 * push gate refused it. The first parent is the only endpoint of a merge
 * that no lane has ever written to.
 *
 * ── AND THE RANGE IS THE LANE'S, WHICH IS A THIRD PAIR ───────────────
 * docs/CONVENTIONS.md's RANGE RULE names two pairs, for "what the merge
 * ADDED to main" — the integrator's `<main-before>..<the merge commit>`
 * and the executor's `merge-tree`. This gate asks a different question:
 * WHAT DID THE LANE WRITE, which is its own merge-base-to-tip range and
 * the identical question the push arm asks. Stated because the notation
 * looks like the range that bullet forbids, and it is not the same
 * endpoint: the forbidden one ends at the MERGE COMMIT and therefore
 * carries main's own meantime work; this one ends at the SECOND PARENT
 * and cannot.
 *
 * ── HOW A MERGE'S LANE IS IDENTIFIED, AND THE LIMIT THAT LEAVES ──────
 * From `git for-each-ref --points-at <M^2>` filtered by the published
 * lane branch spelling. NOT from the merge's SUBJECT: this project writes
 * custom merge subjects and no document publishes their shape, so a
 * scanner over them would be a convention invented at a read site. The
 * limit is that a merge whose lane branch has already been deleted is
 * answered CANNOT COMPARE — announced, per path, never as an allow that
 * claims it looked.
 *
 * @param {string} root
 * @param {string} headRef its HEAD, expected to be the integration branch
 * @param {GateOptions} [opts]
 * @returns {{ verdict: "allow" | "block", code: string, reason: string }}
 */
export function mergeLandingVerdict(root, headRef, opts = {}) {
  const git = opts.git ?? runGit;
  const branch = opts.branch ?? INTEGRATION_BRANCH;

  /** @type {string | undefined} */
  let remote;
  const tried = remoteRefCandidates(branch);
  for (const candidate of tried) {
    const probe = git(root, ["rev-parse", "--verify", "--quiet", `${candidate}^{commit}`]);
    if (probe.status === 0 && /^[0-9a-f]{40}$/.test(probe.stdout.trim())) {
      remote = candidate;
      break;
    }
  }
  if (remote === undefined) {
    // As above: no remote-tracking ref means there is no such thing as
    // "the merges this push would add" to ask about, which is an absent
    // question and not an unanswered one.
    return allow(
      "landing-gate-no-remote",
      `${root} holds no remote-tracking ref for ${JSON.stringify(branch)} (asked for ` +
        `${tried.join(", ")}), so which merge commits a push would add is not a question that ` +
        "can be asked here",
    );
  }

  const list = git(root, ["rev-list", "--merges", `${remote}..HEAD`]);
  if (list.status !== 0) {
    return allow(
      "landing-gate-cannot-compare",
      `THE LANDING GATE DID NOT JUDGE THIS PUSH: \`git rev-list --merges ${remote}..HEAD\` failed ` +
        `(${list.stderr.trim() || "no message"}). The push is allowed and its merges are UNJUDGED.`,
    );
  }
  const merges = list.stdout.split("\n").map((l) => l.trim()).filter((l) => l !== "");
  if (merges.length === 0) {
    return allow("landing-gate-no-new-merges", `${remote}..HEAD carries no merge commit to judge`);
  }

  /** @type {string[]} */
  const refusals = [];
  /** @type {string[]} */
  const unjudged = [];
  for (const merge of merges) {
    const parents = git(root, ["rev-list", "--parents", "-n", "1", merge]);
    const fields = parents.stdout.trim().split(/\s+/);
    if (parents.status !== 0 || fields.length !== 3) {
      unjudged.push(
        `    ${merge}: it has ${fields.length > 0 ? fields.length - 1 : 0} parent(s); this gate ` +
          "reads a two-parent merge and will not guess which parent an octopus merged a lane on",
      );
      continue;
    }
    const first = /** @type {string} */ (fields[1]);
    const second = /** @type {string} */ (fields[2]);

    const refs = git(root, ["for-each-ref", "--format=%(refname)", "--points-at", second, "refs/heads/"]);
    const laneRefs = refs.stdout
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => LANE_BRANCH_RE.test(l));
    if (refs.status !== 0 || laneRefs.length !== 1) {
      unjudged.push(
        `    ${merge}: ${laneRefs.length} lane branch(es) point at its second parent ${second}, ` +
          "so which card fences it cannot be derived (the branch is deleted, or several name it)",
      );
      continue;
    }
    const laneRef = /** @type {string} */ (laneRefs[0]);

    const card = cardAt(root, first, laneCardIds(laneRef), git);
    if ("noBoard" in card) continue;
    if ("problem" in card) {
      refusals.push(
        `    ${merge} (${laneRef}): ${card.problem} — a merge whose lane has no card on its first ` +
          "parent carries no fence, and an unfenced merge is refused rather than admitted",
      );
      continue;
    }
    const read = fenceAt(root, first, card, { ...opts, git });
    if ("problem" in read) {
      unjudged.push(`    ${merge} (${card.id}): ${read.problem}`);
      continue;
    }
    const range = rangePaths(root, first, second, git);
    if ("problem" in range) {
      unjudged.push(`    ${merge} (${card.id}): ${range.problem}`);
      continue;
    }
    if ("universalDual" in read) {
      refusals.push(
        `    ${merge} (${card.id}): ${read.universalDual}, so every one of the ` +
          `${range.paths.length} path(s) it carries is outside it`,
      );
      continue;
    }
    const judged = judgePaths(range.paths, read.fence);
    if (judged.outside.length === 0) continue;
    if (read.fence.unusable.length > 0) {
      unjudged.push(
        `    ${merge} (${card.id}): ${judged.outside.length} path(s) sit outside the RESOLVED ` +
          `domains of a fence carrying unresolvable token(s) ${read.fence.unusable.join(", ")} — ` +
          `${judged.outside.join(", ")}`,
      );
      continue;
    }
    refusals.push(
      `    ${merge} (${card.id}, fence ${read.touchesLine} read from first parent ${first}):\n` +
        judged.outside.map((p) => `      ${p}\n`).join("").replace(/\n$/, ""),
    );
  }

  if (refusals.length > 0) {
    return block(
      "landing-gate-merge-outside-the-fence",
      `PUSH REFUSED: ${refusals.length} of the ${merges.length} merge commit(s) this push would ` +
        "add to the integration branch carry paths outside the fence their own lane declared.\n" +
        "  each merge is judged over merge-base(first parent, second parent)..second parent — the " +
        "LANE's own range — with the fence read from the FIRST parent, which is the only endpoint " +
        "of a merge no lane has written to.\n" +
        `${refusals.join("\n")}\n` +
        (unjudged.length > 0 ? `  and ${unjudged.length} merge(s) could not be judged:\n${unjudged.join("\n")}\n` : "") +
        `  ${ROUTE}`,
    );
  }
  if (unjudged.length > 0) {
    return allow(
      "landing-gate-cannot-compare",
      `THE LANDING GATE DID NOT JUDGE ${unjudged.length} of the ${merges.length} merge commit(s) ` +
        "this push would add:\n" +
        `${unjudged.join("\n")}\n` +
        "  The push is allowed and those merges are UNJUDGED — which is not a claim that they are " +
        "inside any fence.",
    );
  }
  return allow(
    "landing-gate-merges-inside-the-fence",
    `all ${merges.length} merge commit(s) in ${remote}..HEAD carry only paths inside the fence ` +
      "their own lane declared",
  );
}
