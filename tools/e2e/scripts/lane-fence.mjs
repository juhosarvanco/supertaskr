import { existsSync, mkdirSync, readFileSync, realpathSync, writeFileSync } from "node:fs";
import path from "node:path";
import {
  LANE_BRANCH_RE,
  MANIFEST_REL_PATH,
  MANIFEST_VERSION,
  RUNTIME_DIR_IGNORE,
  readManifest,
  touchesLineOf,
} from "../../../.claude/hooks/lane-fence.mjs";
import { conventionsText, repoRoot } from "./docs-scan.mjs";
import {
  git,
  laneSpellings,
  normaliseTaskId,
  parseWorktreePorcelain,
  worktreePorcelain,
} from "./dispatch-brief.mjs";
import { boardFiles, knownPathOracle, loadParser } from "./dispatch-order.mjs";

/**
 * THE FENCE AT THE MOMENT OF THE WRITE (T-154) — the writer.
 *
 * THE EXPANSION HAPPENS ONCE, HERE, WHERE IT CAN. A lane worktree cut
 * ninety seconds ago has no `node_modules` and no `lib/parser/dist`
 * (docs/CONVENTIONS.md, "A FRESH WORKTREE HAS NOTHING INSTALLED AND
 * NOTHING BUILT"), so the fence cannot be expanded at the write. The
 * dispatcher's checkout HAS a built parser by definition — it is what
 * `brief.mjs --task` already runs on — so the dispatch step expands the
 * card's `touches:` through `fence.ts` and leaves the ANSWER in the lane
 * as `.supertaskr/lane-fence.json`. `.claude/hooks/lane-fence.mjs` then reads
 * it with node builtins and nothing else.
 *
 * ── ONE IMPLEMENTATION, AND THE IMPORT IS HOW ────────────────────────
 * Everything this module could have re-spelled it imports instead. The
 * expansion is `@supertaskr/parser`'s `expandFence` — the SAME function the
 * board, `brief.mjs --dispatch` and `readDispatchOrder` use, loaded the
 * same way `dispatch-order.mjs` loads it and for the reason its header
 * gives. The unfenceable set is that module's own `UNFENCEABLE_PATHS`,
 * copied into the manifest rather than restated in the reader. The lane
 * branch spelling is `laneSpellings`, read off docs/CONVENTIONS.md's own
 * bullet. And the `touches:` EXTRACTION is imported from the hook module
 * itself, so the line that gets stamped and the line that gets compared
 * are produced by one function — a second implementation of "which line
 * is the touches line" would be two chances to disagree, which is exactly
 * the staleness this manifest exists to detect.
 *
 * ── THE ORACLE IS LOAD-BEARING ───────────────────────────────────────
 * `expandFence` cannot tell a bare directory token (`docs`) from a word
 * that names nothing (`ci`) without one, and answers `unresolved` for
 * both by design. `knownPathOracle` closes that gap from the tracked
 * tree, exactly as `dispatchContext` already does. A fence carrying an
 * unresolvable token is REFUSED here rather than written short: a
 * manifest that under-reserves is a guard that permits.
 *
 * ── WHY IT ALSO WRITES A `.gitignore` ────────────────────────────────
 * `.supertaskr/` is not ignored in this repository, so without one the
 * manifest is an untracked file in every lane and a `git add -A` commits
 * it. A manifest merged to the integration branch is the guard's own
 * worst failure: every checkout would then carry one lane's fence, and
 * the hook would read a foreign, permanently stale answer. One
 * self-ignoring file in the directory this writer creates costs nothing
 * and removes that shape entirely. Ignoring `.supertaskr/` from the
 * repository's own root `.gitignore` is the tidier home and is outside
 * this card's fence — routed as a suggestion, not taken here.
 *
 * WRITES EXACTLY TWO FILES, BOTH INSIDE THE LANE WORKTREE IT IS HANDED,
 * and never anything in the checkout it runs from.
 */

/**
 * A problem with the REPOSITORY, not with this command.
 *
 * The house exit contract keeps "I derived it and found something" (1)
 * apart from "I could not tell you" (3), and every failure below splits
 * one way or the other: a card with an unresolvable `touches:` token is a
 * FINDING about the board, while a missing `lib/parser/dist` is this
 * command being unable to run at all. The caller reads the class, so the
 * distinction lives beside the throw instead of in a message a wrapper
 * has to pattern-match.
 */
export class LaneFenceFinding extends Error {}

/**
 * The self-ignoring file written beside the manifest. See the header.
 *
 * IT IS NO LONGER SPELLED HERE (T-203). `.supertaskr/` acquired a second
 * writer — the gate-runner's verdict token — and a directory whose
 * non-committability depends on a string each writer keeps its own copy
 * of is one disagreement away from committing a runtime file. The one
 * home is the hook this module already imports its other lane facts from;
 * this name stays as its alias so nothing that reads it has to move.
 */
export const MANIFEST_DIR_IGNORE = RUNTIME_DIR_IGNORE;

/**
 * @typedef {object} LaneFenceManifest
 * @property {number} version
 * @property {string} writtenAt   ISO time — a LIVE fact about this run
 * @property {string} writtenFrom the checkout the expansion was made in
 * @property {string} ref         the commit the expansion is a function of
 * @property {string} taskId
 * @property {string} branch      the lane's branch, read off the worktree
 * @property {string} worktree    the lane worktree this governs
 * @property {string} card        the card, repository-relative
 * @property {string} touchesLine the RAW `touches:` line, verbatim
 * @property {string[]} paths     the expanded fence
 * @property {string[]} excluded  domains carved out — the card's own file
 * @property {string[]} alwaysWritable  what no card may fence
 * @property {{ raw: string, normalized: string, kind: string, components: string[], paths: string[] }[]} tokens
 */

/**
 * @typedef {object} BuildOptions
 * @property {string} [root]      the checkout the expansion is made in
 * @property {string} [at]        ISO time, injectable so a test is not a clock
 * @property {string} [porcelain] `git worktree list --porcelain`, injectable so a
 *   spec can drive a many-lane board without cutting many worktrees. DERIVED
 *   from the repository when absent — the card's own criterion, and the reason
 *   a hand-rolled version of this check with the lane list HARDCODED silently
 *   excluded every card touching `tools/e2e`.
 */

/**
 * Expand one card's fence for one lane worktree.
 *
 * THROWS RATHER THAN RETURNING A SHORT ANSWER. Every failure here is a
 * dispatch error a human has to see — an id with no card, a worktree on
 * the wrong branch, a token the fence cannot resolve — and each is thrown
 * as a `LaneFenceFinding` so the caller can answer 1 rather than 3. A
 * manifest written from a fence this function was unsure about is worse
 * than no manifest at all, because a lane with no manifest is REFUSED and
 * a lane with a short one is quietly permitted.
 *
 * @param {string} taskId
 * @param {string} worktree absolute path to the lane worktree
 * @param {BuildOptions} [options]
 * @returns {Promise<LaneFenceManifest>}
 */
export async function buildLaneFence(taskId, worktree, options = {}) {
  const root = options.root ?? repoRoot;
  const id = normaliseTaskId(taskId);
  const parser = await loadParser();

  const branch = laneBranchOf(worktree);
  const spellings = laneSpellings(conventionsText(root));
  const laneId = laneIdOf(branch, spellings.branchRe);
  if (laneId === undefined) {
    throw new LaneFenceFinding(
      `lane-fence: ${worktree} is on ${branch}, which is not a lane branch — the spelling this ` +
        `repository publishes is ${JSON.stringify(spellings.branchPattern)} (docs/CONVENTIONS.md, ` +
        "the lane bullet). A fence manifest belongs in a lane worktree and nowhere else; writing " +
        "one into the integration checkout would fence the seat that has to be free.",
    );
  }
  if (laneId !== id) {
    throw new LaneFenceFinding(
      `lane-fence: ${worktree} is on ${branch}, whose card is ${laneId}, and the fence asked for ` +
        `is ${id}'s. One task, one branch, one worktree (method/lane-protocol.md rule 1) — this ` +
        "is a dispatch pointing at the wrong tree, not a fence to be written.",
    );
  }

  const model = parser.parseProjectFromFiles(boardFiles(root));
  const card = model.tasks.find(/** @param {{ id: string }} t */ (t) => t.id === id);
  if (card === undefined) {
    throw new LaneFenceFinding(
      `lane-fence: no live card declares id ${id} — the board is read off the tree (flat ` +
        "docs/tasks/T-*.md), so an id with no card is a fence with no source.",
    );
  }

  const fence = parser.expandFence(card, model.components, {
    knownPaths: knownPathOracle(root),
  });
  if (fence.unusable.length > 0) {
    throw new LaneFenceFinding(
      `lane-fence: ${id}'s fence carries ${fence.unusable.length} token(s) this expansion could ` +
        `not resolve — ${fence.unusable.map(/** @param {string} t */ (t) => JSON.stringify(t)).join(", ")}. ` +
        "An unresolved token is not `disjoint from everything`, and a manifest written around one " +
        "would reserve less than the card claims — which is a guard that permits. Spell the token " +
        "as a component slug or a path and re-run.\n" +
        fence.issues
          .map(/** @param {{ message: string }} i */ (i) => `  ${i.message}`)
          .join("\n"),
    );
  }
  if (fence.paths.length === 0) {
    throw new LaneFenceFinding(
      `lane-fence: ${id}'s fence expands to no path at all, so every write in the lane would be ` +
        "refused. A card with an empty `touches:` is not dispatchable.",
    );
  }

  const cardText = readFileSync(path.join(root, card.file), "utf8");
  const line = touchesLineOf(cardText);
  if (line === undefined) {
    throw new LaneFenceFinding(
      `lane-fence: ${card.file} has no \`touches:\` line in its frontmatter, so there is nothing ` +
        "to stamp the manifest with and no way to detect the card moving under the lane.",
    );
  }

  // ── THE INTERSECTION (T-209) ────────────────────────────────────────
  // LAST of the guards, and the order is the ritual: everything above
  // asks whether this CARD is fit to dispatch, and a broken card is
  // reported as broken rather than as colliding. This asks the question
  // only the BOARD can answer, and it is asked from disk every time —
  // `git worktree list --porcelain` at decision time, never a list the
  // dispatcher passed in, remembered or typed.
  const disjointness = laneDisjointness({
    fence,
    taskId: id,
    worktree,
    porcelain: options.porcelain ?? worktreePorcelain(root),
    spellings,
    parser,
    alwaysWritable: parser.UNFENCEABLE_PATHS,
  });
  if (disjointness.verdict !== "disjoint") {
    throw new LaneFenceFinding(disjointnessRefusal(disjointness, id, line));
  }

  return {
    version: MANIFEST_VERSION,
    writtenAt: options.at ?? new Date().toISOString(),
    writtenFrom: root,
    ref: git(root, ["rev-parse", "HEAD"]).trim(),
    taskId: id,
    branch,
    worktree,
    card: card.file,
    touchesLine: line,
    paths: [...fence.paths],
    excluded: [...fence.excluded],
    alwaysWritable: [...parser.UNFENCEABLE_PATHS],
    tokens: fence.tokens.map(
      /** @param {{ raw: string, normalized: string, kind: string, components: string[], paths: string[] }} t */
      (t) => ({
        raw: t.raw,
        normalized: t.normalized,
        kind: t.kind,
        components: [...t.components],
        paths: [...t.paths],
      }),
    ),
  };
}

/**
 * The branch a worktree's HEAD is on, as a FULL ref.
 *
 * `symbolic-ref` and not `rev-parse --abbrev-ref`: the abbreviated form
 * answers the literal string `HEAD` on a detached checkout, which reads
 * like a branch called HEAD and is exactly the kind of near-miss the
 * lane list already refuses elsewhere. `symbolic-ref` FAILS on a
 * detached head, and this function reports that as such.
 *
 * @param {string} worktree
 * @returns {string} the full ref, or `"a detached HEAD"`
 */
export function laneBranchOf(worktree) {
  try {
    return git(worktree, ["symbolic-ref", "--quiet", "HEAD"]).trim();
  } catch {
    return "a detached HEAD";
  }
}

/**
 * The task id a lane branch names, through the PUBLISHED spelling.
 *
 * @param {string} ref a full ref, e.g. `refs/heads/task/T-154-slug`
 * @param {RegExp} branchRe the matcher `laneSpellings` derives
 * @returns {string | undefined}
 */
export function laneIdOf(ref, branchRe) {
  const m = branchRe.exec(ref);
  if (m === null) return undefined;
  return `T-${/** @type {string} */ (m[1])}`;
}

/**
 * THE INTERSECTION (T-209) — rule 5's law, computed instead of asserted.
 *
 * `method/lane-protocol.md` rule 5 has mandated expanded-set lane
 * disjointness since it was "bought with a defect", and until this
 * function nothing computed it: every concurrent dispatch was a seat
 * comparing `touches:` STRINGS in its head, and the seat that filed this
 * card got it wrong three times in one conversation.
 *
 * ── ONE IMPLEMENTATION, AND THE IMPORTS ARE HOW (T-057) ──────────────
 * This function derives nothing that already exists. The enumeration is
 * `parseWorktreePorcelain` over `git worktree list --porcelain`; each live
 * lane's fence is `readManifest`, the hook's ONE manifest reader; the
 * comparison is the parser's `compareFences`, which is already
 * prefix-aware through its own `sharedDomain` and already three-valued.
 * There is no second intersection here and there must never be one — the
 * push and merge call sites are `T-212`'s, and they call THIS, because
 * three copies of a containment rule are three chances to compute it
 * differently.
 *
 * THE CARD ASKED FOR THE HOOK'S `within` AND THIS USES `sharedDomain`
 * INSTEAD, which is the same instruction obeyed one level up. `within(rel,
 * domain)` answers ONE direction — is this path inside that domain — and a
 * fence-versus-fence comparison needs the other half too, plus the NARROWER
 * of the two domains to name in the refusal. Calling `within` twice and
 * picking a winner is re-deriving `sharedDomain`, which is exactly the
 * second copy the card forbids in its next breath. `within` stays the right
 * tool for `T-212`'s push gate, which asks the one-directional question
 * about a diff's paths; it is the wrong one here.
 *
 * ── WHY NOT `liveLanes()`, WHICH LOOKS LIKE EXACTLY THIS ─────────────
 * The hook exports `liveLanes(root)` and it enumerates the same lanes,
 * but it SKIPS a lane whose manifest cannot be read — its documented
 * limit 4, and correct where it lives: a write-time hook that let a
 * stale worktree administration entry lock the integration seat out of
 * the repository would be worse than the leak. At DISPATCH the same skip
 * is the defect this card exists to remove. A live task-branch worktree
 * with no readable manifest is precisely "I cannot compare this", and
 * rule 5 rules that case in as many words — *"a fence that answers 'no
 * overlap' when it means 'I do not know' is worse than one that
 * refuses. Three verdicts, never two."* So the enumeration is done here
 * over the porcelain, which is also what the card asks for by name, and
 * the unreadable lanes are REPORTED rather than dropped.
 *
 * ── WHAT A LIVE LANE RESERVES, AND HOW THE THREE LISTS PARTICIPATE ───
 * A manifest carries `paths`, `excluded` and `alwaysWritable`, and an
 * intersection over one of them headed *complete* is `T-194`'s defect.
 * They do not participate the same way, and saying so is load-bearing:
 *
 * - `paths` is the reserved set and is what is intersected.
 * - `excluded` SUBTRACTS, and `compareFences` already does it: it unions
 *   both fences' `excluded` and drops a shared domain that IS one. The
 *   carve-out reaches an EXACT file and no further, which that function
 *   documents as a ceiling rather than an oversight; this call site
 *   inherits the ceiling and does not paper over it.
 * - `alwaysWritable` does NOT subtract, and this is the one place this
 *   file departs from the card that commissioned it. Rule 5 rules the
 *   unfenceable directory a collision "between a fence and a PROTOCOL
 *   WRITE", and says a fence-versus-fence comparison "has no term for
 *   one. It cannot discover this, ever, so it must not be asked to."
 *   Subtracting it here would be worse than useless: `docs/tasks` is
 *   never a shared DOMAIN (`expandFence` rejects the token outright), so
 *   the only domains a subtraction could ever remove are EXACT CARD
 *   FILES two lanes both fenced — which is a real collision over real
 *   work, and dropping it is a guard that permits. What `alwaysWritable`
 *   participates in instead is a PRECONDITION: it is the parser's
 *   `UNFENCEABLE_PATHS` frozen at the ref its manifest was written at, so
 *   two manifests carrying different ones are two lanes judged under two
 *   different constitutions, and the comparison between them is not
 *   sound. That is checked, and it answers `unusable` rather than
 *   `disjoint`.
 *
 * ── THE THIRD CASE THE CARD DOES NOT NAME ────────────────────────────
 * The card rules an absent or empty `touches:` the UNIVERSAL SET. A
 * DECLARED token that resolves to NOTHING is a third case, and on the
 * new card's side it never reaches this function: `buildLaneFence`
 * already refuses an unusable token and already refuses a fence that
 * expands to no path at all, both above. On the LIVE lane's side a
 * zero-path manifest cannot be written by this module for the same
 * reason — so one found on disk is a hand-edit or a pre-guard artefact,
 * not a lane that reserves nothing, and it is answered `unusable`.
 * Neither side is ever answered `disjoint`, which is the only answer
 * rule 5 forbids.
 *
 * @typedef {object} LaneCollision
 * @property {string} taskId    the OTHER lane's card
 * @property {string} branch
 * @property {string} worktree
 * @property {"overlapping" | "unusable"} verdict
 * @property {string} touchesLine the other lane's `touches:`, verbatim
 * @property {{ left: string, right: string, path: string }[]} witnesses
 * @property {string} why       for `unusable`: what could not be compared
 */

/**
 * @typedef {object} LaneDisjointness
 * @property {"disjoint" | "overlapping" | "unusable"} verdict
 * @property {LaneCollision[]} collisions every lane that is not disjoint
 * @property {{ taskId: string, branch: string, worktree: string }[]} compared
 * @property {number} entries   worktree entries the porcelain named
 */

/**
 * @typedef {object} DisjointnessInput
 * @property {{ tokens: { raw: string, paths: string[] }[], paths: string[], excluded: string[] }} fence
 *   the NEW card's expanded fence, from `expandFence`
 * @property {string} taskId    the new card's id
 * @property {string} worktree  the lane this fence is being written into
 * @property {string} porcelain `git worktree list --porcelain`, verbatim
 * @property {{ branchRe: RegExp }} spellings
 * @property {Record<string, any>} parser the loaded `@supertaskr/parser` namespace —
 *   `compareFences` does the comparison and nothing here re-spells it
 * @property {readonly string[]} alwaysWritable the parser's `UNFENCEABLE_PATHS`
 */

/**
 * Intersect one card's expanded fence against every LIVE lane's.
 *
 * PURE OF GIT AND OF THE CLOCK: it takes the porcelain as text, so a spec
 * drives a six-lane board without creating six worktrees — the seam
 * `dispatchContext` and `mainWorktree` already publish, for the reason
 * their headers give.
 *
 * @param {DisjointnessInput} input
 * @returns {LaneDisjointness}
 */
export function laneDisjointness(input) {
  const { fence, taskId, worktree, porcelain, spellings, parser, alwaysWritable } = input;
  const self = realPath(worktree);

  /** @type {LaneCollision[]} */
  const collisions = [];
  /** @type {{ taskId: string, branch: string, worktree: string }[]} */
  const compared = [];
  const entries = parseWorktreePorcelain(porcelain);

  for (const entry of entries) {
    // A DETACHED ENTRY IS NOT A LANE, and that is the POSITIVE CONTROL
    // rule 5 names: the integrator, the coordinating seat, @human's
    // `../nputer-app` and every scratch drill hold no fence, so a check
    // that refused them would be a check that refuses everything.
    if (entry.branch === "") continue;
    const laneId = laneIdOf(entry.branch, spellings.branchRe);
    if (laneId === undefined) continue;
    // THE LANE BEING DISPATCHED IS NOT ITS OWN NEIGHBOUR. Compared by
    // resolved path rather than by id: a re-run of `--write-fence` over a
    // lane that already has a manifest must not refuse the card against
    // itself, and the path is what `writeLaneFence` is aimed at.
    if (realPath(entry.path) === self) continue;
    // A WORKTREE THAT IS NOT THERE HOLDS NOTHING. `git worktree remove`'s
    // administration outlives the directory until somebody prunes it, and
    // git marks such an entry prunable while still listing it. Refusing
    // against one would block every dispatch in the repository until a
    // prune was run — and it would contradict the ruling this repository
    // already made at the write, where a lane whose worktree is gone
    // fences nothing. THIS IS THE ONLY SKIP, and it is a different fact
    // from the one below: a tree that is absent reserves nothing, while a
    // tree that IS there with no readable manifest is a lane whose fence
    // could not be read, which is the case rule 5 forbids answering
    // "disjoint".
    if (!existsSync(entry.path)) continue;

    const read = readManifest(entry.path);
    if ("problem" in read) {
      collisions.push({
        taskId: laneId,
        branch: entry.branch,
        worktree: entry.path,
        verdict: "unusable",
        touchesLine: "",
        witnesses: [],
        why: `${read.problem} — so what this lane reserves cannot be read, and an unread fence is not "disjoint from everything"`,
      });
      continue;
    }
    const other = read.manifest;

    if (other.paths.length === 0) {
      collisions.push({
        taskId: other.taskId,
        branch: entry.branch,
        worktree: entry.path,
        verdict: "unusable",
        touchesLine: other.touchesLine,
        witnesses: [],
        why: "its manifest reserves no path at all, which this writer refuses to produce — so it is a hand-edited or pre-guard artefact rather than a lane that reserves nothing",
      });
      continue;
    }

    // THE CONSTITUTIONS HAVE TO MATCH BEFORE THE FENCES CAN BE COMPARED.
    // See the header: `alwaysWritable` is `UNFENCEABLE_PATHS` frozen at
    // the ref that manifest was stamped at.
    if (!sameSet(other.alwaysWritable, alwaysWritable)) {
      collisions.push({
        taskId: other.taskId,
        branch: entry.branch,
        worktree: entry.path,
        verdict: "unusable",
        touchesLine: other.touchesLine,
        witnesses: [],
        why:
          `its manifest was stamped with alwaysWritable [${other.alwaysWritable.join(", ")}] and this ` +
          `expansion carries [${[...alwaysWritable].join(", ")}] — the unfenceable set moved between the ` +
          "two dispatches, so the two fences were judged under different rules and the comparison is not sound",
      });
      continue;
    }

    // THE COMPARISON IS THE PARSER'S, NOT A SECOND ONE. A manifest is
    // rendered as the Fence shape `compareFences` reads: ONE token
    // carrying every reserved domain, raw-spelled as the lane's own
    // `touches:` line so a witness names what the other card actually
    // declared. `compareFences` walks TOKENS and not `paths`, so a view
    // with no token would answer `disjoint` vacuously — the shape of a
    // vacuous assertion this repository already killed once.
    const view = {
      tokens: [
        {
          raw: other.touchesLine,
          normalized: "",
          kind: "path",
          components: [],
          paths: [...other.paths],
        },
      ],
      paths: [...other.paths],
      excluded: [...other.excluded],
      // A manifest exists only where `buildLaneFence` found zero unusable
      // tokens — it throws otherwise, above — so this is a derived fact
      // about the writer and not an optimistic default.
      unusable: [],
      issues: [],
    };
    const cmp = parser.compareFences(fence, view);
    compared.push({ taskId: other.taskId, branch: entry.branch, worktree: entry.path });
    if (cmp.verdict === "overlapping") {
      collisions.push({
        taskId: other.taskId,
        branch: entry.branch,
        worktree: entry.path,
        verdict: "overlapping",
        touchesLine: other.touchesLine,
        witnesses: cmp.witnesses.map(
          /** @param {{ left: string, right: string, path: string }} w */
          (w) => ({ left: w.left, right: w.right, path: w.path }),
        ),
        why: "",
      });
    }
  }

  const verdict = collisions.some((c) => c.verdict === "overlapping")
    ? "overlapping"
    : collisions.length > 0
      ? "unusable"
      : "disjoint";
  return { verdict, collisions, compared, entries: entries.length };
}

/**
 * The refusal, in the shape `--write-fence`'s other findings take.
 *
 * IT NAMES BOTH LANES AND THE OVERLAPPING PATHS, which is the card's
 * criterion and not a courtesy: a refusal that does not say what collided
 * sends the seat back to comparing strings in its head, which is the
 * failure this whole card is.
 *
 * @param {LaneDisjointness} report
 * @param {string} taskId
 * @param {string} touchesLine the new card's own `touches:`, verbatim
 * @returns {string}
 */
export function disjointnessRefusal(report, taskId, touchesLine) {
  const lines = [
    `lane-fence: ${taskId} cannot be dispatched — its fence is not disjoint from every live lane ` +
      "(method/lane-protocol.md rule 5: a fence names PATHS, and disjointness is computed over the " +
      "EXPANDED SETS, never over the tokens).",
    `  ${taskId} declares ${touchesLine}`,
  ];
  for (const c of report.collisions) {
    if (c.verdict === "overlapping") {
      lines.push(`  OVERLAPS ${c.taskId} on ${c.branch} at ${c.worktree}`);
      lines.push(`    which declares ${c.touchesLine}`);
      for (const w of c.witnesses) {
        lines.push(
          `    shared path ${w.path} — ${taskId}'s ${JSON.stringify(w.left)} against ${c.taskId}'s ${JSON.stringify(w.right)}`,
        );
      }
    } else {
      lines.push(`  CANNOT COMPARE ${c.taskId} on ${c.branch} at ${c.worktree}`);
      lines.push(`    ${c.why}`);
    }
  }
  lines.push(
    "  Dispatch one of these lanes and hold the other until it merges, or narrow a `touches:` so " +
      "the expanded sets do not meet. A fence is not widened from inside the lane it fences, and " +
      "an overlap answered by widening is the defect rule 5 was bought with.",
  );
  return lines.join("\n");
}

/**
 * Are two path lists the same SET? Order and duplicates do not matter;
 * membership does.
 *
 * @param {readonly string[]} a
 * @param {readonly string[]} b
 * @returns {boolean}
 */
function sameSet(a, b) {
  const left = new Set(a);
  const right = new Set(b);
  if (left.size !== right.size) return false;
  for (const x of left) if (!right.has(x)) return false;
  return true;
}

/**
 * A worktree path as the filesystem resolves it, so the lane being
 * dispatched is recognised as itself.
 *
 * `/tmp` IS A SYMLINK TO `/private/tmp` ON THIS PLATFORM, and a fixture
 * repository cut under it reaches this function spelled both ways — the
 * porcelain's answer and the caller's `path.resolve`. Comparing the two
 * unresolved would make a lane its own neighbour and refuse every
 * re-run. Falls back to the lexical form when the path is not there:
 * a worktree entry git still lists after its directory was removed is a
 * real state, and it belongs in the report rather than in a throw.
 *
 * @param {string} p
 * @returns {string}
 */
function realPath(p) {
  try {
    return realpathSync(p);
  } catch {
    return path.resolve(p);
  }
}

/**
 * Write the manifest into the lane worktree.
 *
 * @param {LaneFenceManifest} manifest
 * @returns {{ manifestFile: string, ignoreFile: string }}
 */
export function writeLaneFence(manifest) {
  const dir = path.join(manifest.worktree, path.dirname(MANIFEST_REL_PATH));
  mkdirSync(dir, { recursive: true });
  const ignoreFile = path.join(dir, ".gitignore");
  writeFileSync(ignoreFile, MANIFEST_DIR_IGNORE, "utf8");
  const manifestFile = path.join(manifest.worktree, MANIFEST_REL_PATH);
  writeFileSync(manifestFile, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  return { manifestFile, ignoreFile };
}

/**
 * THERE IS NO `LANE_FENCE_CONTRACT` OBJECT HERE, AND ITS ABSENCE IS THE
 * POINT — this file held one for exactly one commit before its own drill
 * killed it. It re-exported `MANIFEST_REL_PATH`, `MANIFEST_VERSION` and
 * `LANE_BRANCH_RE` so the spec could "compare the two copies", and there
 * are no two copies: this module IMPORTS all three from the hook, so the
 * comparison was an identity and no mutation of either side could red it.
 * A vacuous assertion is indistinguishable from a passing one
 * (docs/CONVENTIONS.md, POISON DRILL), and dressing an import up as a
 * cross-check is how one gets written.
 *
 * What replaced it is in `lane-fence.spec.ts`: a SOURCE pin that this
 * file defines neither constant and imports both, and a BEHAVIOURAL pin
 * that the file the writer produced is the file the reader opens. Both
 * red under a one-sided mutation; the object could not.
 */
