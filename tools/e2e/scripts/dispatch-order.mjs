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
 * @param {{ root?: string, porcelain?: string, at?: string, host?: string, conventions?: string, files?: {path: string, content: string}[] }} opts
 * @returns {Promise<DispatchCtx>}
 */
export async function dispatchContext(opts = {}) {
  const root = opts.root ?? repoRoot;
  const parser = await loadParser();
  const conventionsMd = opts.conventions ?? conventionsText(root);
  const porcelain = opts.porcelain ?? worktreePorcelain(root);
  const lanes = lanesFrom(porcelain, conventionsMd);
  // `opts.files` is the spec-injection seam, symmetric with
  // `opts.porcelain` and `opts.conventions` above: the board the parser
  // rules on can be a fixture. Added at T-135's close, when the live
  // board's in-flight column emptied for the first time and the
  // in-flight section's populated arm lost its only live fixture.
  const model = parser.parseProjectFromFiles(opts.files ?? boardFiles(root));
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
        `${id} IS A LANE WITH NO CARD IN THIS CHECKOUT — an unstamped or lapsed dispatch, or a ` +
          `lane cut after this tree's base. Its fence cannot be computed, so NOTHING can be ruled ` +
          `disjoint from it and every ready card is UNFENCEABLE below until ${id}'s card is here ` +
          `(it is on the integration branch if the lane was cut from it)`,
        live(laneVia),
      ),
    );
  }

  recs.push(
    blank(),
    note("STARTABLE NOW — ready, and PROVED disjoint from every live lane. In dispatch order."),
  );
  // THE EMPTY LINE HAS TO SAY WHICH EMPTY IT IS. "Nothing is startable"
  // because every ready card is held is a board fact; "nothing is
  // startable" because a lane could not be read at all is a LIVE fact
  // about this checkout, with a different remedy — so it is stamped LIVE
  // and it names the lane.
  if (o.startable.length === 0) {
    recs.push(
      o.lanesWithNoCard.length === 0
        ? value("nothing is startable", tree(boardVia))
        : value(
            `nothing is startable, and the reason is NOT the board: this checkout has no card for ` +
              `${o.lanesWithNoCard.join(", ")}, so no fence could be proved disjoint from ` +
              `${o.lanesWithNoCard.length > 1 ? "them" : "it"} — see UNFENCEABLE below`,
            live(laneVia),
          ),
    );
  }
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

  // UNDERWAY, AND IT IS A BOARD REPORT RATHER THAN A HOLD (T-137-s10,
  // absorbed by T-143). `readDispatchOrder` computes this seventh state
  // and this report emitted it NOWHERE, so a card at `status: building`
  // with a declared fence appeared ZERO times in the whole answer — and
  // a session choosing among cards that overlap its ground was not told
  // such a card existed. The architect reports nearly dispatching
  // against one.
  //
  // WHY IT IS STAMPED TO THE BOARD AND NOT TO THE LANE LIST, in as many
  // words: T-143's own MECHANISM 2 is REFUSED, and this section is where
  // that refusal would be quietly undone. A `status:` stamp is NOT a
  // hold — the lane list is authoritative and the board under-reports by
  // construction — so nothing here is a fence and nothing here changes a
  // verdict above. It is the cheapest thing that closes the gap: the
  // reader is TOLD, and the ruling is left where it belongs.
  //
  // AND IT IS FILTERED TO `IN_FLIGHT`, THROUGH THE PARSER'S OWN SET
  // rather than a status list re-spelled here. `underway` is the
  // scheduler's word for "status is not planned", so it holds every
  // `done` and `parked` card too — 127 and 124 of them on this board at
  // `c74890a8`, which is a dump and not a report. The three statuses
  // that mean somebody is on it right now are `task-waves.ts`'s
  // `IN_FLIGHT`, exported and imported, so a fourth added there arrives
  // here with nothing edited.
  const inFlight = o.underway.filter((/** @type {any} */ r) =>
    ctx.parser.IN_FLIGHT.has(r.card.status),
  );
  recs.push(
    blank(),
    note("IN FLIGHT ON THE BOARD — somebody claims it. A `status:` stamp is NOT a fence hold: the"),
    note("lane list above is what holds ground, and a card here with no lane holds nothing. Read"),
    note("this as a courtesy to whoever is choosing, never as a verdict."),
  );
  if (inFlight.length === 0) recs.push(value("no card is in flight on the board", tree(boardVia)));
  for (const r of inFlight) {
    const laneHeld = o.lanes.some((/** @type {any} */ l) => l.taskId === r.id);
    const fence =
      r.fence.paths.length === 0
        ? "it declares no fence"
        : `it declares ${r.fence.paths.length} path(s)`;
    recs.push(
      value(`${r.id} [${roadmapOf(r.card)}] ${r.card.title}`, tree(`${r.card.file} frontmatter`)),
      value(`   ${r.reason} — ${fence}`, tree(`${r.card.file} frontmatter, fence expanded`)),
      laneHeld
        ? value("   and it HAS a lane above, so that fence is held for real", live(laneVia))
        : value(
            "   and it has NO lane, so it holds no fence — the board stamp is all there is",
            live(laneVia),
          ),
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
