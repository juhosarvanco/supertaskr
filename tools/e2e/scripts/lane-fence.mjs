import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import {
  LANE_BRANCH_RE,
  MANIFEST_REL_PATH,
  MANIFEST_VERSION,
  touchesLineOf,
} from "../../../.claude/hooks/lane-fence.mjs";
import { conventionsText, repoRoot } from "./docs-scan.mjs";
import { git, laneSpellings, normaliseTaskId } from "./dispatch-brief.mjs";
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
 * as `.nputer/lane-fence.json`. `.claude/hooks/lane-fence.mjs` then reads
 * it with node builtins and nothing else.
 *
 * ── ONE IMPLEMENTATION, AND THE IMPORT IS HOW ────────────────────────
 * Everything this module could have re-spelled it imports instead. The
 * expansion is `@nputer/parser`'s `expandFence` — the SAME function the
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
 * `.nputer/` is not ignored in this repository, so without one the
 * manifest is an untracked file in every lane and a `git add -A` commits
 * it. A manifest merged to the integration branch is the guard's own
 * worst failure: every checkout would then carry one lane's fence, and
 * the hook would read a foreign, permanently stale answer. One
 * self-ignoring file in the directory this writer creates costs nothing
 * and removes that shape entirely. Ignoring `.nputer/` from the
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

/** The self-ignoring file written beside the manifest. See the header. */
export const MANIFEST_DIR_IGNORE =
  "# T-154: the lane fence manifest is a runtime file, never a commit.\n*\n";

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
 * The two constants the hook holds and this side can check.
 *
 * Exported so `lane-fence.spec.ts` compares the guard's copy against the
 * authority rather than trusting it — the treatment docs/ARCHITECTURE.md
 * gives its own slug block, one layer over.
 */
export const LANE_FENCE_CONTRACT = Object.freeze({
  manifestRelPath: MANIFEST_REL_PATH,
  manifestVersion: MANIFEST_VERSION,
  laneBranchRe: LANE_BRANCH_RE,
});
