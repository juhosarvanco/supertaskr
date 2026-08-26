import { readFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { conventionsText, repoRoot, trackedFiles } from "./docs-scan.mjs";
import {
  blank,
  git,
  laneSpellings,
  laneWorktrees,
  liveProv,
  note,
  treeProv,
  value,
  worktreePorcelain,
} from "./dispatch-brief.mjs";

/**
 * WHAT IS DISPATCHABLE, IN WHAT ORDER, GIVEN THE LIVE LANES (T-137) — for
 * a session with a terminal and no app.
 *
 * @human named this a core feature: *"The architect session needs precise
 * knowledge of the technical roadmap, task list, task priority and
 * dispatch order, and it needs to be able to update and adapt as new
 * tasks are added."* The app has answered most of it since T-034 —
 * `brief.mjs --task` briefs ONE card, and nothing answered the question
 * across the board for a terminal.
 *
 * ── THIS FILE DERIVES NOTHING IT CAN IMPORT ─────────────────────────
 * That is the whole of T-137 and it is why this module is short:
 *
 *   - THE SCHEDULE — waves, the critical path, transitive holds, the
 *     worst blocker, `ready | waits | blocked | underway` — is
 *     `@nputer/parser`'s `selectTaskSchedule`, moved out of the map pane
 *     by this card. There is ONE implementation and the pane imports the
 *     same one.
 *   - THE FENCE — normalisation, slug expansion, containment,
 *     `overlapping | disjoint | unusable` — is the parser's `fence.ts`,
 *     shipped by T-134. **The architect hand-rolled this expansion an
 *     hour before this card was dispatched, left a path token as itself,
 *     and reported two cards disjoint that overlap by containment.** A
 *     fourth spelling of that rule is the defect, not the deliverable.
 *   - THE LANE LIST — `git worktree list --porcelain` FILTERED ON THE
 *     BRANCH, with the branch pattern read off the project's own lane
 *     bullet — is T-133's `laneSpellings` + `laneWorktrees`, reused
 *     rather than restated.
 *   - THE PROVENANCE — a TREE fact carries a ref, a LIVE fact carries a
 *     time and a host and NEVER a commit — is T-133's `treeProv` /
 *     `liveProv` / `value` / `render`. T-133 was rejected once for
 *     stamping reads of a mutable ref as tree facts; the worktree list is
 *     the same kind of read, and it is stamped LIVE here.
 *
 * ── HOW THE PARSER IS LOADED, AND WHY BY PATH ───────────────────────
 * `tools/e2e` is the repository's THIRD npm package and declares no
 * dependency on `@nputer/parser` (ADR-011 family; its own manifest says
 * it "imports neither app nor parser"). So the parser's BUILT entry is
 * loaded by relative path, exactly as `preflight.ts` already ASSERTS
 * `lib/parser/dist/pure.js` into existence for the same package. A
 * missing build is a loud refusal naming the ADR-011 order, never a
 * silent half-answer. Declaring the dependency properly is a routed
 * suggestion, not a decision an executor makes from inside a lane.
 *
 * ── ADAPTATION IS BY CONSTRUCTION ───────────────────────────────────
 * Nothing here is stored, cached or written. Every answer is derived at
 * call time from the cards on disk and the worktree list, so a card added
 * a minute ago is in the next answer with no bookkeeping — and a stale
 * answer is not possible because there is no remembered one.
 *
 * WRITES NOTHING. Every call in this file is a read.
 */

/** The parser's built entry, relative to this file. */
export const PARSER_DIST = path.join(repoRoot, "lib", "parser", "dist", "index.js");

/**
 * Load the moved analysis. Separated from every caller so the refusal has
 * ONE spelling and a pin can drive it.
 *
 * @returns {Promise<Record<string, any>>}
 */
export async function loadParser(dist = PARSER_DIST) {
  try {
    return await import(pathToFileURL(dist).href);
  } catch (err) {
    throw new Error(
      `dispatch-order: cannot load the parser at ${dist} — ADR-011 build order: lib/parser ` +
        "FIRST (`npm ci` + `npm run build` from lib/parser/), then app/. This command derives " +
        "the schedule and the fence from that ONE implementation and will not re-spell either, " +
        `so without it there is no answer to give. (${err instanceof Error ? err.message : String(err)})`,
    );
  }
}

/**
 * `expandFence`'s oracle: every tracked path AND every directory prefix of
 * one.
 *
 * THE ORACLE IS THE HALF A BOARD CANNOT SUPPLY, and closing it is this
 * consumer's own contribution to the fence rule. `expandFence`'s doc says
 * the oracle is *"the ONLY way this module can tell a bare directory
 * token from a word that names nothing"*: `docs` is a real directory and
 * `ci` is not, and neither carries a `/` or a `.` to give itself away.
 * `selectDispositions` is a pure function of the parsed model and has no
 * filesystem, which is why `T-111` measured 113 disagreeing pairs and
 * ruled them an ORACLE GAP rather than a rule disagreement. **A terminal
 * has the repository, so here the gap simply closes.**
 *
 * The PREFIXES are load-bearing and are not decoration: `git ls-files`
 * lists files, so `docs` never appears in it and a bare `docs` token
 * would resolve to nothing at all without them.
 *
 * @param {string} root
 * @returns {Set<string>}
 */
export function knownPathOracle(root = repoRoot) {
  const known = new Set();
  for (const rel of trackedFiles(root)) {
    known.add(rel);
    const parts = rel.split("/");
    for (let i = 1; i < parts.length; i += 1) known.add(parts.slice(0, i).join("/"));
  }
  return known;
}

/**
 * The board as the parser's PURE entry wants it: `{path, content}` with
 * REPOSITORY-RELATIVE paths, read off `git ls-files`.
 *
 * NOT `parseProject(root)`, AND THE REASON IS A CORRECTNESS ONE RATHER
 * THAN A COSMETIC ONE. The filesystem layer stamps each `TaskRecord.file`
 * with the ABSOLUTE path it walked, and `expandFence` carves a card's own
 * file out of its own fence by comparing that field against the
 * repository-relative domains a `touches:` token expands to. An absolute
 * `file` never matches, so the carve-out silently does not happen and a
 * card holding `docs/architecture/components/` would collide with itself.
 * Relative paths also keep every stamped value a function of the TREE
 * rather than of which checkout happened to run the command.
 *
 * @param {string} root
 * @returns {{ path: string, content: string }[]}
 */
export function boardFiles(root = repoRoot) {
  return trackedFiles(root)
    .filter(
      (rel) =>
        /^docs\/tasks\/[^/]+\.md$/.test(rel) ||
        rel === "docs/ROADMAP.md" ||
        /^docs\/architecture\/components\/[^/]+\.md$/.test(rel),
    )
    .map((rel) => ({ path: rel, content: readFileSync(path.join(root, rel), "utf8") }));
}

/**
 * The live lanes, as `LaneRecord`s the parser can rule on.
 *
 * FILTERED ON THE BRANCH, NEVER THE PATH, and that is a measurement
 * rather than a preference: `T-111-s5` recorded nine worktree entries and
 * three lanes on this repository at 12:12 EEST on 2026-08-26 — four of
 * the six non-lanes were DETACHED scratch checkouts at lane-shaped paths,
 * and a path filter would have reported six lanes holding fences nobody
 * held.
 *
 * @param {string} porcelain
 * @param {string} conventionsMd
 * @returns {{ taskId: string, branch: string, worktree: string, head: string }[]}
 */
export function lanesFrom(porcelain, conventionsMd) {
  return laneWorktrees(porcelain, laneSpellings(conventionsMd)).map((lane) => ({
    taskId: lane.taskId,
    branch: lane.branch,
    worktree: lane.path,
    head: lane.head,
  }));
}

/**
 * @typedef {object} DispatchCtx
 * @property {string} root
 * @property {string} ref   the tree the SCHEDULE is a function of
 * @property {string} at    ISO time the LANE LIST was read
 * @property {string} host
 * @property {any} parser   the loaded parser, held so the TEXT rules are
 *   read off the same module the schedule came from and never re-spelled
 * @property {any} order    the parser's DispatchOrder
 */

/**
 * Derive the whole answer. One read of the worktree list, one parse of
 * the board, one ruling.
 *
 * THE TWO PROVENANCES ARE SEPARATED HERE RATHER THAN AT THE PRINT. `ref`
 * is the tree every board figure is a function of; `at`/`host` belong to
 * the worktree list, which is a read of a MUTABLE environment. T-133 was
 * rejected once for stamping reads of a mutable ref as tree facts, so the
 * two never share a constructor below.
 *
 * @param {{ root?: string, porcelain?: string, at?: string, host?: string, conventions?: string }} opts
 * @returns {Promise<DispatchCtx>}
 */
export async function dispatchContext(opts = {}) {
  const root = opts.root ?? repoRoot;
  const parser = await loadParser();
  const conventionsMd = opts.conventions ?? conventionsText(root);
  const porcelain = opts.porcelain ?? worktreePorcelain(root);
  const lanes = lanesFrom(porcelain, conventionsMd);
  const model = parser.parseProjectFromFiles(boardFiles(root));
  const order = parser.readDispatchOrder(model, lanes, { knownPaths: knownPathOracle(root) });
  return {
    root,
    ref: git(root, ["rev-parse", "HEAD"]).trim(),
    at: opts.at ?? new Date().toISOString(),
    host: opts.host ?? os.hostname(),
    parser,
    order,
  };
}

/** The card's roadmap dimension, REPORTED and never re-derived. */
/** @param {any} card @returns {string} */
function roadmapOf(card) {
  const feature = card.feature ?? "no feature";
  const milestone = card.milestone === undefined ? "no milestone" : `m${card.milestone}`;
  const priority = card.priority === undefined ? "no priority" : `p${card.priority}`;
  return `${feature} ${milestone} ${priority}`;
}

/**
 * The report, as stamped records. Priority order, and the four questions
 * the card owes a terminal: what can start, what is merely unblocked but
 * FENCED (naming the lane), what is BLOCKED (naming the unmet blocker),
 * and the critical path and worst blocker the pane already computes.
 *
 * @param {DispatchCtx} ctx
 * @returns {import("./dispatch-brief.mjs").Rec[]}
 */
export function dispatchReport(ctx) {
  const laneVia = "git worktree list --porcelain, filtered on the branch";
  const boardVia = "flat docs/tasks/T-*.md, parsed";
  /** @param {string} via @returns {import("./dispatch-brief.mjs").Prov} */
  const tree = (via) => treeProv(ctx.ref, via);
  /** @param {string} via @returns {import("./dispatch-brief.mjs").Prov} */
  const live = (via) => liveProv(ctx.at, ctx.host, via);
  const o = ctx.order;

  /** @type {import("./dispatch-brief.mjs").Rec[]} */
  const recs = [
    note("WHAT IS DISPATCHABLE, IN WHAT ORDER, GIVEN THE LIVE LANES — derived, never remembered"),
    value(`repository: ${ctx.root}`, tree("the checkout this command ran in")),
    value(`HEAD in full: ${ctx.ref}`, tree("git rev-parse HEAD")),
    blank(),
    note("THE LIVE LANES — entries on a task branch. A detached worktree is not a lane."),
  ];
  if (o.lanes.length === 0) recs.push(value("no lane is live", live(laneVia)));
  for (const lane of o.lanes) {
    recs.push(
      value(`${lane.taskId} branch ${lane.branch} worktree ${lane.worktree}`, live(laneVia)),
    );
  }
  for (const id of o.lanesWithNoCard) {
    recs.push(
      value(
        `${id} IS A LANE WITH NO CARD — an unstamped or lapsed dispatch; its fence cannot be computed`,
        live(laneVia),
      ),
    );
  }

  recs.push(
    blank(),
    note("STARTABLE NOW — ready, and disjoint from every live lane. In dispatch order."),
  );
  if (o.startable.length === 0) recs.push(value("nothing is startable", tree(boardVia)));
  for (const r of o.startable) {
    recs.push(
      value(`${r.id} [${roadmapOf(r.card)}] ${r.card.title}`, tree(`${r.card.file} frontmatter`)),
      value(`   ${r.reason}`, live(`${laneVia}, joined to the parsed board`)),
    );
  }

  recs.push(
    blank(),
    note("UNBLOCKED BUT FENCED — nothing unmet, and a live lane is holding the files."),
  );
  if (o.fenced.length === 0) recs.push(value("no card is fenced out", live(laneVia)));
  for (const r of o.fenced) {
    recs.push(
      value(`${r.id} [${roadmapOf(r.card)}] ${r.card.title}`, tree(`${r.card.file} frontmatter`)),
      value(`   ${r.reason}`, live(`${laneVia}, compared through the parser's fence module`)),
    );
  }

  if (o.unfenceable.length > 0) {
    recs.push(
      blank(),
      note("UNFENCEABLE — no overlap PROVED and none ruled out. Never folded into disjoint."),
    );
    for (const r of o.unfenceable) {
      recs.push(
        value(`${r.id} [${roadmapOf(r.card)}] ${r.card.title}`, tree(`${r.card.file} frontmatter`)),
        value(`   ${r.reason}`, live(`${laneVia}, compared through the parser's fence module`)),
      );
    }
  }

  recs.push(blank(), note("WAITING — every unmet blocker is in flight, so the wait has an end."));
  if (o.waits.length === 0) recs.push(value("nothing is waiting on an in-flight card", tree(boardVia)));
  for (const r of o.waits) {
    recs.push(
      value(`${r.id} [${roadmapOf(r.card)}] ${r.card.title}`, tree(`${r.card.file} frontmatter`)),
      value(`   ${r.reason}`, tree(`${r.card.file} field blocked_by, resolved on the board`)),
    );
  }

  recs.push(blank(), note("BLOCKED — the unmet blocker is named, and nobody is on it."));
  if (o.blocked.length === 0) recs.push(value("nothing is blocked", tree(boardVia)));
  for (const r of o.blocked) {
    recs.push(
      value(`${r.id} [${roadmapOf(r.card)}] ${r.card.title}`, tree(`${r.card.file} frontmatter`)),
      value(`   ${r.reason}`, tree(`${r.card.file} field blocked_by, resolved on the board`)),
    );
  }

  const s = o.schedule;
  recs.push(
    blank(),
    note("THE CRITICAL PATH AND THE WORST BLOCKER — the pane's own cells, same implementation."),
    value(
      `critical path: ${ctx.parser.criticalPathText(s)}`,
      tree(`${boardVia}, longest blocked_by chain`),
    ),
    value(
      `worst blocker: ${ctx.parser.worstBlockerText(s)}`,
      tree(`${boardVia}, transitive holds`),
    ),
    value(`drawn cards: ${s.total}`, tree(boardVia)),
    value(`ready on blocked_by alone: ${s.readyNow.length}`, tree(boardVia)),
    value(`startable once the lanes are counted: ${o.startable.length}`, live(laneVia)),
    blank(),
    note("ONE HONEST DIFFERENCE FROM THE PANE, named rather than discovered: the worst blocker's"),
    note("rejected-count word needs the app's verdict classifier, which lives in a component"),
    note("outside this card's fence — so a terminal reads the status word where the pane reads"),
    note("the rejected count. Same card, same holds, one word. Routed as a suggestion."),
    blank(),
    note("WHAT THIS COMMAND DELIBERATELY DOES NOT DO: it does not plan and it does not generate"),
    note("cards. That is the architect's judgement, not a derivation. What it gives that"),
    note("judgement is the INPUT — what is startable, what is held, and by whom."),
  );
  return recs;
}
